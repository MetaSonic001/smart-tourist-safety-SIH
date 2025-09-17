from minio import Minio
from minio.error import S3Error
import hashlib
from io import BytesIO
from app.config import settings

class MinIOService:
    def __init__(self):
        self.client = Minio(
            settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure
        )
        self._ensure_bucket()
    
    def _ensure_bucket(self):
        """Ensure the bucket exists"""
        try:
            if not self.client.bucket_exists(settings.minio_bucket):
                self.client.make_bucket(settings.minio_bucket)
        except S3Error as e:
            print(f"MinIO bucket error: {e}")
    
    async def upload_pdf(self, object_name: str, pdf_data: bytes) -> tuple[str, str]:
        """Upload PDF and return (object_key, sha256_hash)"""
        try:
            # Calculate SHA256 hash
            sha256_hash = hashlib.sha256(pdf_data).hexdigest()
            
            # Upload to MinIO
            self.client.put_object(
                settings.minio_bucket,
                object_name,
                BytesIO(pdf_data),
                length=len(pdf_data),
                content_type="application/pdf"
            )
            
            return object_name, sha256_hash
        except S3Error as e:
            raise Exception(f"Failed to upload to MinIO: {e}")

minio_service = MinIOService()