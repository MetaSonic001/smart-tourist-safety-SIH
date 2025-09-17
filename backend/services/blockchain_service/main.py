"""
Blockchain Bridge Service - FastAPI application for Hyperledger Fabric integration
Handles integrity anchors and provides REST API for DID and incident management
"""

import os
import json
import asyncio
import hashlib
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
import redis.asyncio as redis
import asyncpg
from cryptography.fernet import Fernet
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
FABRIC_GATEWAY_URL = os.getenv("FABRIC_GATEWAY_URL")
FABRIC_SDK_CONFIG = os.getenv("FABRIC_SDK_CONFIG")
WALLET_PATH = os.getenv("WALLET_PATH", "./fabric_wallet")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/blockchain_bridge")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
CHAINCODE_NAME = os.getenv("CHAINCODE_NAME", "integrity_anchor")
CHANNEL_NAME = os.getenv("CHANNEL_NAME", "mainchannel")
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key().decode())
FABRIC_DEV_MODE = os.getenv("FABRIC_DEV_MODE", "false").lower() == "true"

# Initialize encryption
cipher_suite = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

# Global connections
db_pool = None
redis_client = None

# Pydantic models
class TransactionRequest(BaseModel):
    op: str
    payload_hash: str
    metadata: Dict[str, Any]
    
    @validator('op')
    def validate_operation(cls, v):
        valid_ops = ['issue_did', 'record_incident', 'anchor_evidence', 'append_audit']
        if v not in valid_ops:
            raise ValueError(f'Operation must be one of {valid_ops}')
        return v
    
    @validator('payload_hash')
    def validate_payload_hash(cls, v):
        if not v or len(v) != 64:
            raise ValueError('payload_hash must be a 64-character SHA256 hex string')
        try:
            int(v, 16)  # Validate hex format
        except ValueError:
            raise ValueError('payload_hash must be a valid hex string')
        return v

class TransactionResponse(BaseModel):
    tx_id: str
    status: str

class QueryRequest(BaseModel):
    query_type: str
    target_id: str

class BlockchainTxRecord(BaseModel):
    tx_id: str
    op_type: str
    target_id: str
    submitted_at: datetime
    confirmed_at: Optional[datetime] = None
    raw_response: Dict[str, Any]

# Database operations
async def init_db():
    """Initialize database connection pool and create tables"""
    global db_pool
    db_pool = await asyncpg.create_pool(DATABASE_URL)
    
    async with db_pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS blockchain_tx (
                tx_id VARCHAR(255) PRIMARY KEY,
                op_type VARCHAR(50) NOT NULL,
                target_id VARCHAR(255) NOT NULL,
                submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
                confirmed_at TIMESTAMP,
                raw_response JSONB
            )
        """)
        
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_blockchain_tx_target_id 
            ON blockchain_tx(target_id)
        """)
        
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_blockchain_tx_op_type 
            ON blockchain_tx(op_type)
        """)

async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    redis_client = redis.from_url(REDIS_URL)

async def store_tx_record(tx_record: BlockchainTxRecord):
    """Store transaction record in database"""
    async with db_pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO blockchain_tx (tx_id, op_type, target_id, submitted_at, raw_response)
            VALUES ($1, $2, $3, $4, $5)
        """, tx_record.tx_id, tx_record.op_type, tx_record.target_id, 
            tx_record.submitted_at, json.dumps(tx_record.raw_response))

async def update_tx_confirmed(tx_id: str, confirmed_at: datetime, block_no: int):
    """Update transaction as confirmed"""
    async with db_pool.acquire() as conn:
        await conn.execute("""
            UPDATE blockchain_tx 
            SET confirmed_at = $1, raw_response = raw_response || $2
            WHERE tx_id = $3
        """, confirmed_at, json.dumps({"block_no": block_no}), tx_id)

async def get_tx_record(tx_id: str) -> Optional[Dict]:
    """Get transaction record by ID"""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT * FROM blockchain_tx WHERE tx_id = $1
        """, tx_id)
        return dict(row) if row else None

# Fabric integration
class FabricClient:
    """Handles Hyperledger Fabric interactions"""
    
    def __init__(self):
        self.dev_mode = FABRIC_DEV_MODE
        self.gateway_url = FABRIC_GATEWAY_URL
        self.wallet_path = WALLET_PATH
        self.chaincode_name = CHAINCODE_NAME
        self.channel_name = CHANNEL_NAME
    
    async def submit_transaction(self, function_name: str, args: List[str]) -> Dict[str, Any]:
        """Submit transaction to Fabric chaincode"""
        if self.dev_mode:
            return await self._mock_submit_transaction(function_name, args)
        
        if self.gateway_url:
            return await self._submit_via_rest_gateway(function_name, args)
        else:
            return await self._submit_via_sdk(function_name, args)
    
    async def _mock_submit_transaction(self, function_name: str, args: List[str]) -> Dict[str, Any]:
        """Mock transaction submission for development"""
        tx_id = f"mock_tx_{uuid.uuid4().hex[:16]}"
        logger.info(f"Mock transaction: {function_name} with args: {args}")
        
        # Simulate async processing
        await asyncio.sleep(0.1)
        
        return {
            "tx_id": tx_id,
            "status": "submitted",
            "mock": True,
            "function": function_name,
            "args": args
        }
    
    async def _submit_via_rest_gateway(self, function_name: str, args: List[str]) -> Dict[str, Any]:
        """Submit transaction via REST gateway"""
        import aiohttp
        
        payload = {
            "chaincode": self.chaincode_name,
            "channel": self.channel_name,
            "function": function_name,
            "args": args
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.gateway_url}/transactions", 
                                   json=payload,
                                   ssl=True) as response:
                if response.status == 200:
                    result = await response.json()
                    return result
                else:
                    raise HTTPException(status_code=500, 
                                      detail=f"Fabric gateway error: {response.status}")
    
    async def _submit_via_sdk(self, function_name: str, args: List[str]) -> Dict[str, Any]:
        """Submit transaction via Fabric Python SDK"""
        # Note: This would require the hfc (Hyperledger Fabric Client) package
        # For now, we'll raise an error indicating SDK mode is not implemented
        raise HTTPException(status_code=500, 
                          detail="Fabric SDK mode not implemented. Use REST gateway or dev mode.")
    
    async def query_chaincode(self, function_name: str, args: List[str]) -> Dict[str, Any]:
        """Query chaincode for data"""
        if self.dev_mode:
            return await self._mock_query(function_name, args)
        
        if self.gateway_url:
            return await self._query_via_rest_gateway(function_name, args)
        else:
            return await self._query_via_sdk(function_name, args)
    
    async def _mock_query(self, function_name: str, args: List[str]) -> Dict[str, Any]:
        """Mock query for development"""
        logger.info(f"Mock query: {function_name} with args: {args}")
        return {
            "result": f"mock_result_for_{function_name}",
            "mock": True,
            "function": function_name,
            "args": args
        }
    
    async def _query_via_rest_gateway(self, function_name: str, args: List[str]) -> Dict[str, Any]:
        """Query via REST gateway"""
        import aiohttp
        
        payload = {
            "chaincode": self.chaincode_name,
            "channel": self.channel_name,
            "function": function_name,
            "args": args
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.gateway_url}/queries",
                                   json=payload,
                                   ssl=True) as response:
                if response.status == 200:
                    result = await response.json()
                    return result
                else:
                    raise HTTPException(status_code=500,
                                      detail=f"Fabric gateway query error: {response.status}")
    
    async def _query_via_sdk(self, function_name: str, args: List[str]) -> Dict[str, Any]:
        """Query via Fabric Python SDK"""
        raise HTTPException(status_code=500,
                          detail="Fabric SDK mode not implemented. Use REST gateway or dev mode.")

# Initialize Fabric client
fabric_client = FabricClient()

# Background task for monitoring confirmations
async def monitor_transaction_confirmations():
    """Background task to monitor transaction confirmations"""
    while True:
        try:
            if not FABRIC_DEV_MODE:
                # In production, this would listen to Fabric block events
                # For now, we'll simulate confirmations for demo purposes
                await asyncio.sleep(5)
                continue
            
            # In dev mode, simulate confirmations
            async with db_pool.acquire() as conn:
                unconfirmed = await conn.fetch("""
                    SELECT tx_id, op_type, target_id 
                    FROM blockchain_tx 
                    WHERE confirmed_at IS NULL 
                    AND submitted_at < NOW() - INTERVAL '2 seconds'
                    LIMIT 10
                """)
                
                for record in unconfirmed:
                    await confirm_transaction(
                        record['tx_id'], 
                        record['op_type'], 
                        record['target_id']
                    )
            
            await asyncio.sleep(2)
            
        except Exception as e:
            logger.error(f"Error in transaction monitoring: {e}")
            await asyncio.sleep(5)

async def confirm_transaction(tx_id: str, op_type: str, target_id: str):
    """Confirm a transaction and publish to Redis"""
    try:
        confirmed_at = datetime.utcnow()
        block_no = hash(tx_id) % 1000000  # Mock block number
        
        await update_tx_confirmed(tx_id, confirmed_at, block_no)
        
        # Publish confirmation event
        confirmation_event = {
            "tx_id": tx_id,
            "type": op_type,
            "target_id": target_id,
            "block_no": block_no,
            "timestamp": confirmed_at.isoformat()
        }
        
        await redis_client.publish("blockchain.tx.confirmed", json.dumps(confirmation_event))
        logger.info(f"Transaction confirmed: {tx_id}")
        
    except Exception as e:
        logger.error(f"Error confirming transaction {tx_id}: {e}")

# Lifespan management
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    await init_redis()
    
    # Start background task
    monitor_task = asyncio.create_task(monitor_transaction_confirmations())
    
    yield
    
    # Shutdown
    monitor_task.cancel()
    if db_pool:
        await db_pool.close()
    if redis_client:
        await redis_client.close()

# FastAPI app
app = FastAPI(
    title="Blockchain Bridge Service",
    description="REST API for Hyperledger Fabric integration",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper functions
def extract_target_id(op: str, metadata: Dict[str, Any]) -> str:
    """Extract target ID based on operation type"""
    if op == "issue_did":
        return metadata.get("digital_id", "unknown")
    elif op == "record_incident":
        return metadata.get("incident_id", "unknown")
    elif op == "anchor_evidence":
        return metadata.get("incident_id", "unknown")
    elif op == "append_audit":
        return metadata.get("audit_id", "unknown")
    return "unknown"

def prepare_chaincode_args(op: str, payload_hash: str, metadata: Dict[str, Any]) -> List[str]:
    """Prepare arguments for chaincode function calls"""
    args = [payload_hash, json.dumps(metadata)]
    return args

# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "dev_mode": FABRIC_DEV_MODE
    }

@app.post("/transactions", response_model=TransactionResponse)
async def submit_transaction(
    request: TransactionRequest,
    background_tasks: BackgroundTasks
):
    """Submit a transaction to the blockchain"""
    try:
        # Generate transaction ID
        tx_id = str(uuid.uuid4())
        
        # Extract target ID
        target_id = extract_target_id(request.op, request.metadata)
        
        # Prepare chaincode arguments
        chaincode_function = request.op
        chaincode_args = prepare_chaincode_args(request.op, request.payload_hash, request.metadata)
        
        # Submit to Fabric
        fabric_response = await fabric_client.submit_transaction(chaincode_function, chaincode_args)
        
        # Store transaction record
        tx_record = BlockchainTxRecord(
            tx_id=tx_id,
            op_type=request.op,
            target_id=target_id,
            submitted_at=datetime.utcnow(),
            raw_response=fabric_response
        )
        
        await store_tx_record(tx_record)
        
        logger.info(f"Transaction submitted: {tx_id} for {request.op}")
        
        return TransactionResponse(tx_id=tx_id, status="submitted")
        
    except Exception as e:
        logger.error(f"Error submitting transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/queries")
async def query_blockchain(request: QueryRequest):
    """Query blockchain for DID or incident status"""
    try:
        function_name = f"query_{request.query_type}"
        args = [request.target_id]
        
        result = await fabric_client.query_chaincode(function_name, args)
        
        return {
            "query_type": request.query_type,
            "target_id": request.target_id,
            "result": result
        }
        
    except Exception as e:
        logger.error(f"Error querying blockchain: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transactions/{tx_id}")
async def get_transaction_status(tx_id: str):
    """Get transaction status by ID"""
    try:
        record = await get_tx_record(tx_id)
        
        if not record:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        return {
            "tx_id": record["tx_id"],
            "op_type": record["op_type"],
            "target_id": record["target_id"],
            "submitted_at": record["submitted_at"].isoformat(),
            "confirmed_at": record["confirmed_at"].isoformat() if record["confirmed_at"] else None,
            "status": "confirmed" if record["confirmed_at"] else "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transactions")
async def list_transactions(
    op_type: Optional[str] = None,
    target_id: Optional[str] = None,
    limit: int = 50
):
    """List transactions with optional filtering"""
    try:
        query = "SELECT * FROM blockchain_tx"
        params = []
        conditions = []
        
        if op_type:
            conditions.append("op_type = $" + str(len(params) + 1))
            params.append(op_type)
        
        if target_id:
            conditions.append("target_id = $" + str(len(params) + 1))
            params.append(target_id)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY submitted_at DESC LIMIT $" + str(len(params) + 1)
        params.append(limit)
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
        
        transactions = []
        for row in rows:
            transactions.append({
                "tx_id": row["tx_id"],
                "op_type": row["op_type"],
                "target_id": row["target_id"],
                "submitted_at": row["submitted_at"].isoformat(),
                "confirmed_at": row["confirmed_at"].isoformat() if row["confirmed_at"] else None,
                "status": "confirmed" if row["confirmed_at"] else "pending"
            })
        
        return {"transactions": transactions, "total": len(transactions)}
        
    except Exception as e:
        logger.error(f"Error listing transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)