import httpx
from app.config import settings
from typing import Optional

class BlockchainService:
    def __init__(self):
        self.base_url = settings.blockchain_url
    
    async def anchor_evidence(self, evidence_hash: str, incident_id: str) -> Optional[str]:
        """Anchor evidence hash to blockchain and return transaction ID"""
        if settings.use_fake_blockchain:
            return f"fake_tx_{evidence_hash[:16]}"
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/blockchain/anchor_evidence",
                    json={
                        "evidence_hash": evidence_hash,
                        "incident_id": incident_id
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json().get("tx_id")
        except Exception as e:
            print(f"Blockchain service error: {e}")
            return None

blockchain_service = BlockchainService()