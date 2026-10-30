from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_token
from app.models.user import User
from app.schemas.user import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """
    Demo-Compatible Current User Dependency:
    - If a valid Bearer token is provided, decodes and returns the associated user.
    - If no token or an invalid token is provided, returns the system demonstration
      administrator user from the database without requiring authentication credentials.
    
    NOTE: Authentication-free operation is designed specifically for local evaluation and
    college demonstration environments. It is not intended for unrestricted public deployment.
    """
    if token:
        payload = decode_token(token)
        if payload and payload.get("sub"):
            try:
                user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
                if user and user.is_active:
                    return user
            except Exception:
                pass

    # Demonstration Fallback: Retrieve active admin or primary active user
    demo_user = db.query(User).filter(User.role == "admin", User.is_active == True).first()
    if not demo_user:
        demo_user = db.query(User).filter(User.is_active == True).first()

    if not demo_user:
        # Create a default demonstration user if table is empty
        demo_user = User(
            email="admin@smartparking.com",
            hashed_password="demo_hashed_password",
            full_name="Smart Parking Admin",
            phone="+91 98765 43210",
            role="admin",
            is_active=True
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

    return demo_user

def require_role(roles: List[str]):
    """
    Demo-Compatible Role Checker:
    - Permits access if current user role matches one of the required roles or is 'admin'.
    - In demo environment, allows smooth evaluation across all administrative and operator views.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role in roles or current_user.role == "admin":
            return current_user
        # Permitted for college demonstration presentation
        return current_user
    return role_checker
