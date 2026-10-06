"""
FastAPI dependency injection functions for authentication, authorization, and rate limiting.
"""

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.redis import is_token_blacklisted, check_rate_limit
from app.services.auth import decode_token
from app.db.models import User


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract and validate JWT from httpOnly cookie, return the authenticated user.

    Raises:
        HTTPException 401: If token is missing, invalid, expired, or blacklisted.
        HTTPException 401: If the user no longer exists.
    """
    token = request.cookies.get("access_token")
    if not token:
        # Also check Authorization header as fallback (for API clients)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )

    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Check token blacklist
    if await is_token_blacklisted(payload.jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == payload.sub))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Extract and validate JWT if present, return None if not authenticated."""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
        else:
            return None

    try:
        payload = decode_token(token)
        if await is_token_blacklisted(payload.jti):
            return None
        result = await db.execute(select(User).where(User.id == payload.sub))
        return result.scalar_one_or_none()
    except Exception:
        return None



async def require_student(user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures the authenticated user has the 'student' role."""
    if str(user.role) not in ("student", "RoleEnum.student"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )
    return user


async def require_instructor(user: User = Depends(get_current_user)) -> User:
    """Dependency that ensures the authenticated user has the 'instructor' role."""
    if str(user.role) not in ("instructor", "RoleEnum.instructor"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Instructor access required",
        )
    return user


async def require_any(user: User = Depends(get_current_user)) -> User:
    """Dependency that requires any authenticated user (student or instructor)."""
    return user


def RateLimitDep(*args, **kwargs):
    """Factory for rate-limiting dependencies.
    Accepts (limit, window) or (name, limit, window).
    Returns a callable dependency suitable for Depends(RateLimitDep(...)).
    """
    if len(args) == 3:
        name, limit, window = args
    elif len(args) == 2:
        if isinstance(args[0], str):
            name, limit, window = args[0], args[1], 60
        else:
            name, limit, window = "global", args[0], args[1]
    elif len(args) == 1:
        name, limit, window = "global", args[0], 60
    else:
        name = kwargs.get("name", "global")
        limit = kwargs.get("limit", 60)
        window = kwargs.get("window", 60)

    async def _rate_limit_check(request: Request):
        user_id = "anonymous"
        token = request.cookies.get("access_token")
        if token:
            try:
                payload = decode_token(token)
                user_id = payload.sub
            except ValueError:
                pass

        if user_id == "anonymous" and request.client:
            user_id = request.client.host

        key = f"ratelimit:{user_id}:{request.url.path}"
        try:
            allowed = await check_rate_limit(key, limit, window)
            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Maximum {limit} requests per {window}s.",
                )
        except Exception:
            # If Redis is unavailable or unconfigured, allow request
            pass

    return _rate_limit_check

