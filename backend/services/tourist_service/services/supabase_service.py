import httpx
import os
from typing import Optional
from models import Tourist

class SupabaseService:
    @staticmethod
    async def create_tourist_summary(tourist: Tourist) -> Optional[Dict]:
        """Mirror tourist summary to Supabase"""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            return None
            
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "tourist_id": str(tourist.tourist_id),
            "digital_id": str(tourist.digital_id),
            "opt_in_tracking": tourist.opt_in_tracking,
            "created_at": tourist.created_at.isoformat(),
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{supabase_url}/rest/v1/tourist_summaries",
                    headers=headers,
                    json=data
                )
                return response.json() if response.status_code == 201 else None
            except Exception as e:
                print(f"Supabase sync error: {e}")
                return None
