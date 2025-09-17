"""
Unit tests for blockchain bridge service
"""

import pytest
import asyncio
import json
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient
from fastapi.testclient import TestClient
import hashlib
import uuid

# Import the app
from main import app, fabric_client, init_db, init_redis

@pytest.fixture
async def test_client():
    """Create test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def valid_payload_hash():
    """Generate valid SHA256 hash"""
    return hashlib.sha256(b"test_payload").hexdigest()

@pytest.fixture
def sample_transaction_request(valid_payload_hash):
    """Sample transaction request"""
    return {
        "op": "issue_did",
        "payload_hash": valid_payload_hash,
        "metadata": {
            "digital_id": "did:example:123",
            "consent_hash": "consent_hash_123",
            "issued_at": "2025-01-01T00:00:00Z",
            "expires_at": "2026-01-01T00:00:00Z",
            "issuer": "test_issuer"
        }
    }

class TestTransactionValidation:
    """Test transaction request validation"""
    
    def test_valid_operations(self):
        """Test valid operation types"""
        valid_ops = ['issue_did', 'record_incident', 'anchor_evidence', 'append_audit']
        for op in valid_ops:
            request = {
                "op": op,
                "payload_hash": "a" * 64,  # Valid 64-char hex
                "metadata": {"test": "data"}
            }
            # This should not raise validation error
            from main import TransactionRequest
            TransactionRequest(**request)
    
    def test_invalid_operation(self):
        """Test invalid operation type"""
        from main import TransactionRequest
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            TransactionRequest(
                op="invalid_op",
                payload_hash="a" * 64,
                metadata={"test": "data"}
            )
    
    def test_invalid_payload_hash_length(self):
        """Test invalid payload hash length"""
        from main import TransactionRequest
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            TransactionRequest(
                op="issue_did",
                payload_hash="short_hash",
                metadata={"test": "data"}
            )
    
    def test_invalid_payload_hash_format(self):
        """Test invalid payload hash format"""
        from main import TransactionRequest
        from pydantic import ValidationError
        
        with pytest.raises(ValidationError):
            TransactionRequest(
                op="issue_did",
                payload_hash="g" * 64,  # Invalid hex character
                metadata={"test": "data"}
            )

class TestFabricClient:
    """Test Fabric client functionality"""
    
    @pytest.mark.asyncio
    async def test_invalid_transaction_request(self, test_client):
        """Test invalid transaction request"""
        invalid_request = {
            "op": "invalid_op",
            "payload_hash": "short",
            "metadata": {}
        }
        
        response = await test_client.post("/transactions", json=invalid_request)
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    @patch('main.fabric_client.query_chaincode')
    async def test_query_blockchain(self, mock_query, test_client):
        """Test blockchain query"""
        mock_query.return_value = {
            "result": "test_result",
            "mock": True
        }
        
        query_request = {
            "query_type": "did",
            "target_id": "did:example:123"
        }
        
        response = await test_client.post("/queries", json=query_request)
        
        assert response.status_code == 200
        data = response.json()
        assert data["query_type"] == "did"
        assert data["target_id"] == "did:example:123"
        assert "result" in data
    
    @pytest.mark.asyncio
    @patch('main.get_tx_record')
    async def test_get_transaction_status_found(self, mock_get_tx, test_client):
        """Test getting transaction status - found"""
        mock_tx_record = {
            "tx_id": "test_tx_123",
            "op_type": "issue_did",
            "target_id": "did:example:123",
            "submitted_at": datetime.utcnow(),
            "confirmed_at": datetime.utcnow(),
            "raw_response": {"status": "confirmed"}
        }
        mock_get_tx.return_value = mock_tx_record
        
        response = await test_client.get("/transactions/test_tx_123")
        
        assert response.status_code == 200
        data = response.json()
        assert data["tx_id"] == "test_tx_123"
        assert data["status"] == "confirmed"
    
    @pytest.mark.asyncio
    @patch('main.get_tx_record')
    async def test_get_transaction_status_not_found(self, mock_get_tx, test_client):
        """Test getting transaction status - not found"""
        mock_get_tx.return_value = None
        
        response = await test_client.get("/transactions/nonexistent_tx")
        
        assert response.status_code == 404
    
    @pytest.mark.asyncio
    @patch('main.db_pool')
    async def test_list_transactions(self, mock_db_pool, test_client):
        """Test listing transactions"""
        mock_conn = AsyncMock()
        mock_rows = [
            {
                "tx_id": "tx_1",
                "op_type": "issue_did",
                "target_id": "did:1",
                "submitted_at": datetime.utcnow(),
                "confirmed_at": None
            },
            {
                "tx_id": "tx_2", 
                "op_type": "record_incident",
                "target_id": "incident_1",
                "submitted_at": datetime.utcnow(),
                "confirmed_at": datetime.utcnow()
            }
        ]
        mock_conn.fetch.return_value = mock_rows
        mock_db_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        response = await test_client.get("/transactions")
        
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert len(data["transactions"]) == 2

class TestUtilityFunctions:
    """Test utility functions"""
    
    def test_extract_target_id(self):
        """Test target ID extraction"""
        from main import extract_target_id
        
        # Test issue_did
        metadata = {"digital_id": "did:example:123"}
        target_id = extract_target_id("issue_did", metadata)
        assert target_id == "did:example:123"
        
        # Test record_incident
        metadata = {"incident_id": "incident_123"}
        target_id = extract_target_id("record_incident", metadata)
        assert target_id == "incident_123"
        
        # Test anchor_evidence
        metadata = {"incident_id": "incident_456"}
        target_id = extract_target_id("anchor_evidence", metadata)
        assert target_id == "incident_456"
        
        # Test unknown operation
        metadata = {}
        target_id = extract_target_id("unknown_op", metadata)
        assert target_id == "unknown"
    
    def test_prepare_chaincode_args(self):
        """Test chaincode arguments preparation"""
        from main import prepare_chaincode_args
        
        payload_hash = "abcd1234"
        metadata = {"test": "data"}
        
        args = prepare_chaincode_args("issue_did", payload_hash, metadata)
        
        assert len(args) == 2
        assert args[0] == payload_hash
        assert json.loads(args[1]) == metadata

class TestRedisIntegration:
    """Test Redis integration"""
    
    @pytest.mark.asyncio
    @patch('main.redis_client')
    async def test_publish_confirmation(self, mock_redis):
        """Test publishing confirmation to Redis"""
        from main import confirm_transaction
        
        mock_redis.publish = AsyncMock()
        
        # This would normally update database, but we'll mock that part
        with patch('main.update_tx_confirmed'):
            await confirm_transaction("tx_123", "issue_did", "did:example:123")
        
        # Verify Redis publish was called
        mock_redis.publish.assert_called_once()
        call_args = mock_redis.publish.call_args
        assert call_args[0][0] == "blockchain.tx.confirmed"
        
        # Verify the published data structure
        published_data = json.loads(call_args[0][1])
        assert published_data["tx_id"] == "tx_123"
        assert published_data["type"] == "issue_did"
        assert published_data["target_id"] == "did:example:123"
        assert "block_no" in published_data
        assert "timestamp" in published_data

class TestDatabaseOperations:
    """Test database operations"""
    
    @pytest.mark.asyncio
    @patch('main.db_pool')
    async def test_store_tx_record(self, mock_db_pool):
        """Test storing transaction record"""
        from main import store_tx_record, BlockchainTxRecord
        from datetime import datetime
        
        # Mock database connection
        mock_conn = AsyncMock()
        mock_db_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        tx_record = BlockchainTxRecord(
            tx_id="tx_123",
            op_type="issue_did",
            target_id="did:example:123",
            submitted_at=datetime.utcnow(),
            raw_response={"status": "submitted"}
        )
        
        await store_tx_record(tx_record)
        
        # Verify database execute was called
        mock_conn.execute.assert_called_once()
    
    @pytest.mark.asyncio
    @patch('main.db_pool')
    async def test_get_tx_record(self, mock_db_pool):
        """Test getting transaction record"""
        from main import get_tx_record
        from datetime import datetime
        
        # Mock database connection and response
        mock_conn = AsyncMock()
        mock_row = {
            "tx_id": "tx_123",
            "op_type": "issue_did",
            "target_id": "did:example:123",
            "submitted_at": datetime.utcnow(),
            "confirmed_at": None,
            "raw_response": {"status": "submitted"}
        }
        mock_conn.fetchrow.return_value = mock_row
        mock_db_pool.acquire.return_value.__aenter__.return_value = mock_conn
        
        result = await get_tx_record("tx_123")
        
        assert result == mock_row
        mock_conn.fetchrow.assert_called_once()

# Integration tests
class TestIntegration:
    """Integration tests"""
    
    @pytest.mark.asyncio
    @patch('main.init_db')
    @patch('main.init_redis')  
    async def test_transaction_flow(self, mock_redis, mock_db):
        """Test complete transaction flow"""
        from main import fabric_client
        
        # Set dev mode for testing
        fabric_client.dev_mode = True
        
        # Test transaction submission
        result = await fabric_client.submit_transaction(
            "issue_did", 
            ["hash123", '{"digital_id": "did:example:123"}']
        )
        
        assert "tx_id" in result
        assert result["status"] == "submitted"
        
        # Test query
        query_result = await fabric_client.query_chaincode(
            "query_did", 
            ["did:example:123"]
        )
        
        assert "result" in query_result

if __name__ == "__main__":
    pytest.main([__file__])

def test_mock_submit_transaction(self):
    """Test mock transaction submission"""
    client = fabric_client
    client.dev_mode = True

    result = asyncio.run(client.submit_transaction("issue_did", ["hash123", '{"test": "data"}']))

    assert "tx_id" in result
    assert result["status"] == "submitted"
    assert result["mock"] is True
    assert result["function"] == "issue_did"

@pytest.mark.asyncio
async def test_mock_query(self):
    """Test mock query functionality"""
    client = fabric_client
    client.dev_mode = True

    result = await client.query_chaincode("query_did", ["did:example:123"])

    assert "result" in result
    assert result["mock"] is True
    assert result["function"] == "query_did"

class TestAPIEndpoints:
    """Test API endpoints"""
    
    @pytest.mark.asyncio
    async def test_health_check(self, test_client):
        """Test health check endpoint"""
        response = await test_client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "dev_mode" in data
    
    @pytest.mark.asyncio
    @patch('main.init_db')
    @patch('main.init_redis')
    @patch('main.store_tx_record')
    @patch('main.fabric_client.submit_transaction')
    async def test_submit_transaction(
        self, 
        mock_fabric_submit,
        mock_store,
        mock_redis,
        mock_db,
        test_client,
        sample_transaction_request
    ):
        """Test transaction submission"""
        # Mock fabric response
        mock_fabric_submit.return_value = {
            "tx_id": "fabric_tx_123",
            "status": "submitted"
        }
        mock_store.return_value = None
        
        response = await test_client.post("/transactions", json=sample_transaction_request)
        
        assert response.status_code == 200
        data = response.json()
        assert "tx_id" in data
        assert data["status"] == "submitted"
    
    @pytest.mark.asyncio
    async def test_submit_transaction_invalid_payload(self, test_client):
        """Test transaction submission with invalid payload"""
        invalid_request = {
            "op": "invalid_op",
            "payload_hash": "short",
            "metadata": {}
        }
        
        response = await test_client.post("/transactions", json=invalid_request)
        assert response.status_code == 422  # Validation error