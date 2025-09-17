import qrcode
import base64
from io import BytesIO
from datetime import datetime, timedelta
from typing import Dict, Any
import uuid
import json
from jose import jwt
import os

class QRService:
    @staticmethod
    async def generate_offline_pass(
        tourist_id: uuid.UUID,
        digital_id: uuid.UUID,
        pii_pointer: str,
        expires_in_hours: int = 24
    ) -> Dict[str, Any]:
        """Generate offline QR pass with encrypted pointer"""
        expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
        
        # Create token payload
        payload = {
            "tourist_id": str(tourist_id),
            "digital_id": str(digital_id),
            "pii_pointer": pii_pointer,
            "exp": expires_at.timestamp()
        }
        
        # Sign token (in real implementation, use proper secret management)
        secret_key = os.getenv("JWT_SECRET", "your-secret-key")
        token = jwt.encode(payload, secret_key, algorithm="HS256")
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(token)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffered = BytesIO()
        img.save(buffered)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return {
            "token": token,
            "qr_url": f"data:image/png;base64,{img_str}",
            "expires_at": expires_at
        }
