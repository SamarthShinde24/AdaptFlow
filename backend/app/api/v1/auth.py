from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.db.redis import get_redis, blacklist_token
from app.db.models import User
from app.schemas.auth import (
    SignupRequest, LoginRequest, AuthResponse, UserRead
)
from app.schemas.base import APIResponse
from app.services.auth import (
    hash_password, verify_password, create_access_token, 
    create_refresh_token, store_refresh_token, rotate_refresh_token,
    revoke_all_user_tokens, decode_token
)
from app.core.deps import get_current_user
from datetime import datetime, timezone
import uuid

from app.core.config import settings

router = APIRouter()

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/"
    )

@router.post("/signup", response_model=APIResponse[AuthResponse])
async def signup(
    request: SignupRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_pwd = hash_password(request.password)
    user = User(
        id=uuid.uuid4(),
        email=request.email,
        password_hash=hashed_pwd,
        full_name=request.full_name,
        role=request.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id), user.role)
    
    payload = decode_token(refresh_token)
    await store_refresh_token(
        db, str(user.id), hash_password(refresh_token), 
        datetime.fromtimestamp(payload.exp, timezone.utc)
    )
    
    set_auth_cookies(response, access_token, refresh_token)
    
    return APIResponse(
        success=True,
        data=AuthResponse(
            user=UserRead.model_validate(user),
            access_token=access_token,
            token_type="bearer"
        )
    )

@router.post("/login", response_model=APIResponse[AuthResponse])
async def login(
    request: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    access_token = create_access_token(str(user.id), user.role)
    refresh_token = create_refresh_token(str(user.id), user.role)
    
    payload = decode_token(refresh_token)
    await store_refresh_token(
        db, str(user.id), hash_password(refresh_token), 
        datetime.fromtimestamp(payload.exp, timezone.utc)
    )
    
    set_auth_cookies(response, access_token, refresh_token)
    
    return APIResponse(
        success=True,
        data=AuthResponse(
            user=UserRead.model_validate(user),
            access_token=access_token,
            token_type="bearer"
        )
    )

@router.post("/refresh", response_model=APIResponse[AuthResponse])
async def refresh(
    req: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis)
):
    old_refresh = req.cookies.get("refresh_token")
    if not old_refresh:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    try:
        new_access, new_refresh = await rotate_refresh_token(db, redis, old_refresh)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
        
    set_auth_cookies(response, new_access, new_refresh)
    
    payload = decode_token(new_access)
    result = await db.execute(select(User).where(User.id == payload.sub))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    return APIResponse(
        success=True,
        data=AuthResponse(
            user=UserRead.model_validate(user),
            access_token=new_access,
            token_type="bearer"
        )
    )

@router.post("/logout", response_model=APIResponse)
async def logout(
    req: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis),
    user: User = Depends(get_current_user)
):
    access_token = req.cookies.get("access_token")
    if access_token:
        try:
            payload = decode_token(access_token)
            exp = datetime.fromtimestamp(payload.exp, timezone.utc)
            ttl = int((exp - datetime.now(timezone.utc)).total_seconds())
            if ttl > 0:
                await blacklist_token(redis, payload.jti, ttl)
        except Exception:
            pass
            
    await revoke_all_user_tokens(db, str(user.id))
    
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    
    return APIResponse(success=True)

@router.get("/me", response_model=APIResponse[UserRead])
async def get_me(user: User = Depends(get_current_user)):
    return APIResponse(
        success=True,
        data=UserRead.model_validate(user)
    )
