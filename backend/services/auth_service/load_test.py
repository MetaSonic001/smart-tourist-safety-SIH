from locust import HttpUser, task, between
import json
import uuid

class TouristOnboardingUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Register and login a test user
        self.username = f"testuser_{uuid.uuid4().hex[:8]}"
        self.password = "password123"
        
        # Register user
        register_data = {
            "username": self.username,
            "email": f"{self.username}@example.com",
            "password": self.password,
            "full_name": f"Test User {self.username}",
            "role": "tourist"
        }
        
        response = self.client.post("/auth/register", json=register_data)
        if response.status_code == 200:
            print(f"✅ User {self.username} registered successfully")
        
        # Login and get token
        login_data = {
            "username": self.username,
            "password": self.password
        }
        
        response = self.client.post("/auth/token", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            self.token = token_data["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
            print(f"✅ User {self.username} logged in successfully")
        else:
            print(f"❌ Login failed for {self.username}")
    
    @task(3)
    def health_check(self):
        """Test health endpoint"""
        self.client.get("/health")
    
    @task(2)
    def get_user_info(self):
        """Test getting user information"""
        if hasattr(self, 'headers'):
            self.client.get("/auth/me", headers=self.headers)
    
    @task(1)
    def onboarding_flow(self):
        """Test complete onboarding flow"""
        # Start onboarding
        start_data = {
            "entry_point": "kiosk",
            "device_id": f"test_device_{uuid.uuid4().hex[:8]}"
        }
        
        response = self.client.post("/onboarding/start", json=start_data)
        if response.status_code != 200:
            return
        
        session_data = response.json()
        session_id = session_data["session_id"]
        
        # Submit KYC (mock)
        kyc_data = {
            "kyc_token": f"mock_token_{uuid.uuid4().hex}",
            "consent_scope": "tracking,location,emergency"
        }
        
        response = self.client.post(
            f"/onboarding/{session_id}/kyc",
            data=kyc_data
        )
        
        if response.status_code != 200:
            return
        
        # Complete onboarding
        complete_data = {
            "opt_in_tracking": True
        }
        
        self.client.post(
            f"/onboarding/{session_id}/complete",
            json=complete_data
        )
