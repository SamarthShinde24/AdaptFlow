import bcrypt
from datetime import datetime, timedelta, timezone
import jwt
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from app.core.config import settings
from app.schemas.auth import TokenPayload
from app.db.models import RefreshToken

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')[:72]
    return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))

def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "exp": expire,
        "sub": str(user_id),
        "role": role,
        "jti": str(uuid4())
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: str, role: str = "") -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "exp": expire,
        "sub": str(user_id),
        "role": role,
        "jti": str(uuid4())
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> TokenPayload:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return TokenPayload(**payload)
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")

async def store_refresh_token(db: AsyncSession, user_id: str, token_hash: str, expires_at: datetime) -> RefreshToken:
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        revoked=False
    )
    db.add(db_token)
    await db.commit()
    await db.refresh(db_token)
    return db_token

async def rotate_refresh_token(db: AsyncSession, redis, old_token: str) -> tuple[str, str]:
    payload = decode_token(old_token)
    user_id = payload.sub
    role = getattr(payload, "role", "student")
    
    new_access = create_access_token(user_id, role)
    new_refresh = create_refresh_token(user_id)
    
    new_payload = decode_token(new_refresh)
    await store_refresh_token(
        db, 
        user_id, 
        hash_password(new_refresh), 
        datetime.fromtimestamp(new_payload.exp, timezone.utc)
    )
    
    return new_access, new_refresh

async def revoke_all_user_tokens(db: AsyncSession, user_id: str):
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id)
        .values(revoked=True)
    )
    await db.commit()
