import jwt
import hashlib
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from keycloak import KeycloakOpenID, KeycloakAdmin
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import settings
from models import User
from schemas import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

class AuthManager:
    def __init__(self):
        self.keycloak_openid = None
        self.keycloak_admin = None
        
        if settings.USE_KEYCLOAK:
            self.keycloak_openid = KeycloakOpenID(
                server_url=settings.KEYCLOAK_SERVER_URL,
                client_id=settings.KEYCLOAK_CLIENT_ID,
                realm_name=settings.KEYCLOAK_REALM,
                client_secret_key=settings.KEYCLOAK_CLIENT_SECRET
            )
    
    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
    
    def create_jwt_token(self, data: dict) -> str:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt
    
    def decode_jwt_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
    
    async def create_keycloak_user(self, user_data: UserCreate) -> dict:
        """Create user in Keycloak"""
        # Implementation would depend on Keycloak setup
        # This is a simplified version
        raise NotImplementedError("Keycloak integration not fully implemented")
    
    async def authenticate_keycloak(self, username: str, password: str) -> dict:
        """Authenticate against Keycloak"""
        if not self.keycloak_openid:
            raise HTTPException(status_code=500, detail="Keycloak not configured")
        
        try:
            token = self.keycloak_openid.token(username, password)
            user_info = self.keycloak_openid.userinfo(token['access_token'])
            
            return {
                "access_token": token['access_token'],
                "token_type": "bearer",
                "expires_in": token['expires_in'],
                "user_id": user_info['sub'],
                "role": user_info.get('role', 'tourist')
            }
        except Exception as e:
            raise HTTPException(status_code=401, detail="Authentication failed")
    
    async def create_local_user(self, user_data: UserCreate, db: AsyncSession) -> dict:
        """Create user in local database"""
        # Check if user exists
        result = await db.execute(
            select(User).where(User.username == user_data.username)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Username already registered")
        
        result = await db.execute(
            select(User).where(User.email == user_data.email)
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        hashed_password = self.hash_password(user_data.password)
        db_user = User(
            username=user_data.username,
            email=user_data.email,
            full_name=user_data.full_name,
            password_hash=hashed_password,
            role=user_data.role.value,
            phone=user_data.phone
        )
        
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        return {
            "user_id": str(db_user.user_id),
            "username": db_user.username,
            "email": db_user.email,
            "full_name": db_user.full_name,
            "role": db_user.role,
            "created_at": db_user.created_at,
            "is_active": db_user.is_active
        }
    
    async def authenticate_local(self, username: str, password: str, db: AsyncSession) -> dict:
        """Authenticate against local database"""
        result = await db.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()
        
        if not user or not self.verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        if not user.is_active:
            raise HTTPException(status_code=401, detail="User account is disabled")
        
        # Create JWT token
        token_data = {
            "sub": str(user.user_id),
            "username": user.username,
            "role": user.role
        }
        access_token = self.create_jwt_token(token_data)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRY_HOURS * 3600,
            "user_id": str(user.user_id),
            "role": user.role
        }

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    """Get current authenticated user"""
    auth_manager = AuthManager()
    
    try:
        if settings.USE_KEYCLOAK:
            # Decode Keycloak token
            payload = auth_manager.keycloak_openid.decode_token(token)
            return {
                "user_id": payload['sub'],
                "username": payload.get('preferred_username'),
                "role": payload.get('role', 'tourist'),
                "email": payload.get('email')
            }
        else:
            # Decode local JWT token
            payload = auth_manager.decode_jwt_token(token)
            user_id = payload.get("sub")
            
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            result = await db.execute(
                select(User).where(User.user_id == user_id)
            )
            user = result.scalar_one_or_none()
            
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            
            return {
                "user_id": str(user.user_id),
                "username": user.username,
                "role": user.role,
                "email": user.email,
                "full_name": user.full_name
            }
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
