from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import logging
import secrets

from config import SECRET_KEY, ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = 15      # Short-lived; refreshed silently by the client
REFRESH_TOKEN_EXPIRE_DAYS = 7         # Long-lived opaque secret stored hashed in DB

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    # Use timezone-aware UTC (datetime.utcnow() is deprecated since Python 3.12)
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token() -> str:
    """Returns a cryptographically secure random opaque token (not a JWT)."""
    return secrets.token_urlsafe(48)   # 384-bit entropy — effectively impossible to brute-force


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
