import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
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


def create_oauth_state(origin: str) -> str:
    issued_at = int(datetime.now(timezone.utc).timestamp())
    nonce = secrets.token_urlsafe(24)
    payload = {"iat": issued_at, "nonce": nonce, "origin": origin}
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode()
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).rstrip(b"=").decode()
    signature = hmac.new(settings.jwt_secret.encode(), payload_b64.encode(), hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).rstrip(b"=").decode()
    return f"{payload_b64}.{signature_b64}"

def verify_oauth_state(state: str | None) -> dict | None:
    if not state:
        return None
    legacy_state_time = oauth_states.pop(state, None)
    if legacy_state_time:
        return {"origin": settings.frontend_url}
    if "." not in state:
        return None
    payload_b64, signature_b64 = state.rsplit(".", 1)
    expected = hmac.new(settings.jwt_secret.encode(), payload_b64.encode(), hashlib.sha256).digest()
    actual = base64.urlsafe_b64decode(signature_b64 + "=" * (-len(signature_b64) % 4))
    if not hmac.compare_digest(expected, actual):
        return None
    payload_bytes = base64.urlsafe_b64decode(payload_b64 + "=" * (-len(payload_b64) % 4))
    payload = json.loads(payload_bytes)
    issued_at = datetime.fromtimestamp(payload["iat"], tz=timezone.utc)
    if datetime.now(timezone.utc) - issued_at > timedelta(minutes=10):
        return None
    return payload


def trim_error_body(text: str, limit: int = 500) -> str:
    clean = " ".join(text.split())
    return clean[:limit]


@router.get("/google")
async def google_login(request: Request):
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
        )

    referer = request.headers.get("Referer", "").rstrip("/")
    origin = referer if referer and referer.startswith(("http://", "https://")) else settings.frontend_url
    state = create_oauth_state(origin)

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

    try:
        state_payload = verify_oauth_state(state)
    except Exception:
        state_payload = None
    if not state_payload:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
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
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Google token request failed: {exc.__class__.__name__}") from exc

    if token_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to exchange code for token: {trim_error_body(token_response.text)}",
        )

    token_data = token_response.json()
    access_token = token_data.get("access_token")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            userinfo_response = await client.get(
                settings.google_userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Google userinfo request failed: {exc.__class__.__name__}") from exc

    if userinfo_response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to fetch user info: {trim_error_body(userinfo_response.text)}",
        )

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
    origin = state_payload.get("origin", settings.frontend_url)
    redirect_url = f"{origin}/auth/callback?token={jwt_token}"
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
