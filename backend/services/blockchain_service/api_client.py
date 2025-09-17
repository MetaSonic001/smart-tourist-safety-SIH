"""
API Client for Blockchain Bridge Service
Provides a Python interface for other services to interact with the blockchain bridge
"""

import asyncio
import json
import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

import httpx
import redis.asyncio as redis

logger = logging.getLogger(__name__)

@dataclass
class TransactionResult:
    """Result of a blockchain transaction"""
    tx_id: str
    status: str
    submitted_at: datetime
    confirmed_at: Optional[datetime] = None
    error: Optional[str] = None

class BlockchainBridgeClient:
    """
    Client for interacting with the Blockchain Bridge service
    Used by Auth, Alert, and Operator services
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:8002",
        redis_url: str = "redis://localhost:6379",
        timeout: int = 30
    ):
        self.base_url = base_url.rstrip('/')
        self.redis_url = redis_url
        self.timeout = timeout
        self._http_client: Optional[httpx.AsyncClient] = None
        self._redis_client: Optional[redis.Redis] = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
    
    async def connect(self):
        """Initialize connections"""
        self._http_client = httpx.AsyncClient(timeout=self.timeout)
        self._redis_client = redis.from_url(self.redis_url)
    
    async def close(self):
        """Close connections"""
        if self._http_client:
            await self._http_client.aclose()
        if self._redis_client:
            await self._redis_client.close()
    
    def _generate_payload_hash(self, payload: bytes) -> str:
        """Generate SHA256 hash for payload"""
        return hashlib.sha256(payload).hexdigest()
    
    async def issue_did(
        self,
        digital_id: str,
        consent_data: bytes,
        issuer: str,
        expires_at: Optional[datetime] = None
    ) -> TransactionResult:
        """
        Issue a Digital Identity (DID)
        Called by Auth & Onboarding service
        """
        consent_hash = self._generate_payload_hash(consent_data)
        
        if expires_at is None:
            expires_at = datetime.now(timezone.utc).replace(year=datetime.now().year + 1)
        
        metadata = {
            "digital_id": digital_id,
            "consent_hash": consent_hash,
            "issued_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at.isoformat(),
            "issuer": issuer
        }
        
        return await self._submit_transaction("issue_did", consent_hash, metadata)
    
    async def record_incident(
        self,
        incident_id: str,
        incident_summary: bytes,
        reporter: str
    ) -> TransactionResult:
        """
        Record an incident on the blockchain
        Called by Alert Management service when e-FIR is generated
        """
        incident_summary_hash = self._generate_payload_hash(incident_summary)
        
        metadata = {
            "incident_id": incident_id,
            "incident_summary_hash": incident_summary_hash,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "reporter": reporter
        }
        
        return await self._submit_transaction("record_incident", incident_summary_hash, metadata)
    
    async def anchor_evidence(
        self,
        incident_id: str,
        evidence_data: bytes,
        uploaded_by: str,
        evidence_type: str = "audio_recording"
    ) -> TransactionResult:
        """
        Anchor evidence to the blockchain
        Called by Operator service to anchor call recording hashes
        """
        evidence_hash = self._generate_payload_hash(evidence_data)
        
        metadata = {
            "evidence_hash": evidence_hash,
            "incident_id": incident_id,
            "uploaded_by": uploaded_by,
            "evidence_type": evidence_type,
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        
        return await self._submit_transaction("anchor_evidence", evidence_hash, metadata)
    
    async def append_audit(
        self,
        audit_data: bytes,
        audit_id: str
    ) -> TransactionResult:
        """
        Append audit block to blockchain
        Optional operation for audit trail
        """
        audit_hash = self._generate_payload_hash(audit_data)
        
        metadata = {
            "audit_id": audit_id,
            "audit_hash": audit_hash,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        return await self._submit_transaction("append_audit", audit_hash, metadata)
    
    async def _submit_transaction(
        self,
        op: str,
        payload_hash: str,
        metadata: Dict[str, Any]
    ) -> TransactionResult:
        """Submit transaction to blockchain bridge"""
        if not self._http_client:
            raise RuntimeError("Client not connected. Use async context manager or call connect()")
        
        try:
            request_data = {
                "op": op,
                "payload_hash": payload_hash,
                "metadata": metadata
            }
            
            response = await self._http_client.post(
                f"{self.base_url}/transactions",
                json=request_data
            )
            
            if response.status_code == 200:
                data = response.json()
                return TransactionResult(
                    tx_id=data["tx_id"],
                    status=data["status"],
                    submitted_at=datetime.now(timezone.utc)
                )
            else:
                error_msg = f"Transaction submission failed: {response.status_code}"
                logger.error(f"{error_msg} - {response.text}")
                return TransactionResult(
                    tx_id="",
                    status="error",
                    submitted_at=datetime.now(timezone.utc),
                    error=error_msg
                )
                
        except Exception as e:
            error_msg = f"Transaction submission error: {str(e)}"
            logger.error(error_msg)
            return TransactionResult(
                tx_id="",
                status="error", 
                submitted_at=datetime.now(timezone.utc),
                error=error_msg
            )
    
    async def get_transaction_status(self, tx_id: str) -> Optional[Dict[str, Any]]:
        """Get transaction status by ID"""
        if not self._http_client:
            raise RuntimeError("Client not connected")
        
        try:
            response = await self._http_client.get(f"{self.base_url}/transactions/{tx_id}")
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 404:
                return None
            else:
                logger.error(f"Failed to get transaction status: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting transaction status: {e}")
            return None
    
    async def query_did(self, digital_id: str) -> Optional[Dict[str, Any]]:
        """Query DID status from blockchain"""
        return await self._query_blockchain("did", digital_id)
    
    async def query_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """Query incident status from blockchain"""
        return await self._query_blockchain("incident", incident_id)
    
    async def query_evidence(self, incident_id: str) -> Optional[Dict[str, Any]]:
        """Query evidence for an incident from blockchain"""
        return await self._query_blockchain("evidence", incident_id)
    
    async def _query_blockchain(self, query_type: str, target_id: str) -> Optional[Dict[str, Any]]:
        """Query blockchain for data"""
        if not self._http_client:
            raise RuntimeError("Client not connected")
        
        try:
            request_data = {
                "query_type": query_type,
                "target_id": target_id
            }
            
            response = await self._http_client.post(
                f"{self.base_url}/queries",
                json=request_data
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Query failed: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error querying blockchain: {e}")
            return None
    
    async def list_transactions(
        self,
        op_type: Optional[str] = None,
        target_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List transactions with optional filtering"""
        if not self._http_client:
            raise RuntimeError("Client not connected")
        
        try:
            params = {"limit": limit}
            if op_type:
                params["op_type"] = op_type
            if target_id:
                params["target_id"] = target_id
            
            response = await self._http_client.get(
                f"{self.base_url}/transactions",
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("transactions", [])
            else:
                logger.error(f"Failed to list transactions: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error listing transactions: {e}")
            return []
    
    async def wait_for_confirmation(
        self,
        tx_id: str,
        timeout: int = 300
    ) -> Optional[Dict[str, Any]]:
        """
        Wait for transaction confirmation via Redis pub/sub
        Returns confirmation event or None if timeout
        """
        if not self._redis_client:
            raise RuntimeError("Redis client not connected")
        
        pubsub = self._redis_client.pubsub()
        await pubsub.subscribe("blockchain.tx.confirmed")
        
        try:
            timeout_task = asyncio.create_task(asyncio.sleep(timeout))
            listen_task = asyncio.create_task(self._listen_for_confirmation(pubsub, tx_id))
            
            done, pending = await asyncio.wait(
                [timeout_task, listen_task],
                return_when=asyncio.FIRST_COMPLETED
            )
            
            # Cancel remaining tasks
            for task in pending:
                task.cancel()
            
            if listen_task in done:
                return await listen_task
            else:
                logger.warning(f"Transaction confirmation timeout for {tx_id}")
                return None
                
        finally:
            await pubsub.unsubscribe("blockchain.tx.confirmed")
            await pubsub.close()
    
    async def _listen_for_confirmation(
        self,
        pubsub: redis.client.PubSub,
        target_tx_id: str
    ) -> Optional[Dict[str, Any]]:
        """Listen for specific transaction confirmation"""
        async for message in pubsub.listen():
            if message['type'] == 'message':
                try:
                    event = json.loads(message['data'])
                    if event.get('tx_id') == target_tx_id:
                        return event
                except json.JSONDecodeError:
                    continue
        return None
    
    async def health_check(self) -> bool:
        """Check if the blockchain bridge service is healthy"""
        if not self._http_client:
            raise RuntimeError("Client not connected")
        
        try:
            response = await self._http_client.get(f"{self.base_url}/health")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False

# Example usage functions for different services
class AuthServiceIntegration:
    """Integration helper for Auth & Onboarding service"""
    
    def __init__(self, blockchain_client: BlockchainBridgeClient):
        self.client = blockchain_client
    
    async def issue_user_did(
        self,
        user_id: str,
        consent_document: bytes,
        authority_name: str
    ) -> str:
        """Issue DID for a new user and return transaction ID"""
        digital_id = f"did:emergency:user:{user_id}"
        
        result = await self.client.issue_did(
            digital_id=digital_id,
            consent_data=consent_document,
            issuer=authority_name
        )
        
        if result.status == "submitted":
            logger.info(f"DID issued for user {user_id}: {result.tx_id}")
            return result.tx_id
        else:
            logger.error(f"Failed to issue DID for user {user_id}: {result.error}")
            raise Exception(f"DID issuance failed: {result.error}")

class AlertServiceIntegration:
    """Integration helper for Alert Management service"""
    
    def __init__(self, blockchain_client: BlockchainBridgeClient):
        self.client = blockchain_client
    
    async def create_incident_record(
        self,
        incident_id: str,
        e_fir_document: bytes,
        operator_id: str
    ) -> str:
        """Create incident record when e-FIR is generated"""
        result = await self.client.record_incident(
            incident_id=incident_id,
            incident_summary=e_fir_document,
            reporter=operator_id
        )
        
        if result.status == "submitted":
            logger.info(f"Incident recorded: {incident_id} -> {result.tx_id}")
            return result.tx_id
        else:
            logger.error(f"Failed to record incident {incident_id}: {result.error}")
            raise Exception(f"Incident recording failed: {result.error}")

class OperatorServiceIntegration:
    """Integration helper for Operator service"""
    
    def __init__(self, blockchain_client: BlockchainBridgeClient):
        self.client = blockchain_client
    
    async def anchor_call_recording(
        self,
        incident_id: str,
        audio_data: bytes,
        operator_id: str
    ) -> str:
        """Anchor call recording hash to blockchain"""
        result = await self.client.anchor_evidence(
            incident_id=incident_id,
            evidence_data=audio_data,
            uploaded_by=operator_id,
            evidence_type="audio_recording"
        )
        
        if result.status == "submitted":
            logger.info(f"Evidence anchored for incident {incident_id}: {result.tx_id}")
            return result.tx_id
        else:
            logger.error(f"Failed to anchor evidence for {incident_id}: {result.error}")
            raise Exception(f"Evidence anchoring failed: {result.error}")

# Example usage
async def main():
    """Example usage of the blockchain bridge client"""
    
    async with BlockchainBridgeClient() as client:
        # Health check
        is_healthy = await client.health_check()
        print(f"Service healthy: {is_healthy}")
        
        # Issue a DID
        consent_data = b"User consent document content"
        result = await client.issue_did(
            digital_id="did:emergency:user:12345",
            consent_data=consent_data,
            issuer="emergency_authority"
        )
        
        if result.status == "submitted":
            print(f"DID issued: {result.tx_id}")
            
            # Wait for confirmation
            confirmation = await client.wait_for_confirmation(result.tx_id, timeout=30)
            if confirmation:
                print(f"Transaction confirmed in block {confirmation['block_no']}")
            
            # Check status
            status = await client.get_transaction_status(result.tx_id)
            print(f"Final status: {status}")

if __name__ == "__main__":
    asyncio.run(main())