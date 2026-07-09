import secrets
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode
import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import settings
from app.database import get_db
from app.models import User
from app.schemas.auth import UserOut, AuthStatus
from app.core.security import create_jwt_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

oauth_states: dict[str, datetime] = {}


@router.get("/google")
async def google_login():
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
        )

    state = secrets.token_urlsafe(32)
    oauth_states[state] = datetime.now(timezone.utc)

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    auth_url = f"{settings.google_auth_url}?{urlencode(params)}"
    return RedirectResponse(url=auth_url, status_code=307)


@router.get("/google/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    if state:
        state_time = oauth_states.pop(state, None)
        if state_time and (datetime.now(timezone.utc) - state_time) > timedelta(minutes=10):
            raise HTTPException(status_code=400, detail="OAuth state expired")
    else:
        raise HTTPException(status_code=400, detail="Missing state parameter")

    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        token_response = await client.post(
            settings.google_token_url,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
            headers={"Accept": "application/json"},
        )

    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")

    token_data = token_response.json()
    access_token = token_data.get("access_token")

    async with httpx.AsyncClient(timeout=10.0) as client:
        userinfo_response = await client.get(
            settings.google_userinfo_url,
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if userinfo_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user info")

    userinfo = userinfo_response.json()
    google_id = userinfo.get("id")
    email = userinfo.get("email")
    name = userinfo.get("name")
    avatar_url = userinfo.get("picture")

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Invalid user info from Google")

    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if user:
        user.email = email
        user.name = name
        user.avatar_url = avatar_url
    else:
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)

    jwt_token = create_jwt_token(user.id)
    redirect_url = f"{settings.frontend_url}/auth/callback?token={jwt_token}"
    return RedirectResponse(url=redirect_url, status_code=307)


@router.get("/me", response_model=AuthStatus)
async def get_current_user_info(user: User | None = Depends(get_current_user)):
    if not user:
        return AuthStatus(is_authenticated=False, is_guest=False, user=None)

    return AuthStatus(
        is_authenticated=True,
        is_guest=False,
        user=UserOut.model_validate(user),
    )


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}


@router.get("/guest", response_model=AuthStatus)
async def guest_login():
    return AuthStatus(is_authenticated=True, is_guest=True, user=None)
