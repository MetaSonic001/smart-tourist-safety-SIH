from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from app.config import settings
import httpx

security = HTTPBearer()

async def verify_token(token: str = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id: str = payload.get("sub")
        role: str = payload.get("role", "user")
        
        if user_id is None:
            raise credentials_exception
            
        return {"user_id": user_id, "role": role}
    except JWTError:
        raise credentials_exception

def require_role(required_roles: List[str]):
    def role_checker(current_user: dict = Depends(verify_token)):
        if current_user["role"] not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker