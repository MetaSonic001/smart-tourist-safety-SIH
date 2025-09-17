import pytest
from app.services.blockchain_service import blockchain_service
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_blockchain_anchor_fake():
    """Test blockchain anchoring in fake mode"""
    with patch('app.config.settings.use_fake_blockchain', True):
        tx_id = await blockchain_service.anchor_evidence("test_hash", "incident_001")
        assert tx_id.startswith("fake_tx_")
        assert "test_hash" in tx_id

@pytest.mark.asyncio
async def test_blockchain_anchor_real():
    """Test blockchain anchoring with real service"""
    with patch('app.config.settings.use_fake_blockchain', False):
        with patch('httpx.AsyncClient.post') as mock_post:
            mock_response = AsyncMock()
            mock_response.json.return_value = {"tx_id": "real_tx_12345"}
            mock_response.raise_for_status.return_value = None
            mock_post.return_value = mock_response
            
            tx_id = await blockchain_service.anchor_evidence("test_hash", "incident_001")
            assert tx_id == "real_tx_12345"