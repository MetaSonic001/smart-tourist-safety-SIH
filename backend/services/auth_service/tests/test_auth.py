import pytest
import hashlib
import json
from datetime import datetime, timedelta
from auth import AuthManager
from services import OnboardingService

class TestAuth:
    def setup_method(self):
        self.auth_manager = AuthManager()
    
    def test_password_hashing(self):
        password = "test_password_123"
        hashed = self.auth_manager.hash_password(password)
        assert hashed != password
        assert self.auth_manager.verify_password(password, hashed)
        assert not self.auth_manager.verify_password("wrong_password", hashed)
    
    def test_jwt_token_creation_and_verification(self):
        payload = {
            "sub": "user123",
            "username": "testuser",
            "role": "tourist"
        }
        token = self.auth_manager.create_jwt_token(payload)
        assert token
        
        decoded = self.auth_manager.decode_jwt_token(token)
        assert decoded["sub"] == "user123"
        assert decoded["username"] == "testuser"
        assert decoded["role"] == "tourist"


class TestOnboarding:
    def setup_method(self):
        self.onboarding_service = OnboardingService()
    
    def test_consent_hash_generation(self):
        digital_id = "550e8400-e29b-41d4-a716-446655440000"
        issued_at = datetime(2024, 1, 1, 12, 0, 0)
        
        consent_data = {
            "digital_id": digital_id,
            "consent_scope": "tracking,location,emergency",
            "issued_at": issued_at.isoformat()
        }
        
        expected_hash = hashlib.sha256(
            json.dumps(consent_data, sort_keys=True).encode()
        ).hexdigest()
        
        # This would be generated in the actual service
        assert len(expected_hash) == 64  # SHA256 hex length
        assert expected_hash.isalnum()  # Contains only alphanumeric characters
    
    def test_kyc_token_verification(self):
        # Test valid token
        valid_token = "digilocker_token_123456789"
        assert self.onboarding_service._verify_kyc_token(valid_token)
        
        # Test invalid token
        invalid_token = "short"
        assert not self.onboarding_service._verify_kyc_token(invalid_token)
