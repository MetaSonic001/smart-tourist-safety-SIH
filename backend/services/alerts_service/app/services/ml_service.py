import httpx
from app.config import settings
from typing import Optional, Dict, Any

class MLService:
    def __init__(self):
        self.base_url = settings.ml_url
    
    async def get_individual_score(self, digital_id: str, location: tuple[float, float]) -> Optional[Dict[str, Any]]:
        """Get individual risk score from ML service"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/ml/individual_score",
                    json={
                        "digital_id": digital_id,
                        "lat": location[0],
                        "lng": location[1]
                    },
                    timeout=10.0
                )
                if response.status_code == 200:
                    return response.json()
        except Exception as e:
            print(f"ML service error: {e}")
        return None

ml_service = MLService()