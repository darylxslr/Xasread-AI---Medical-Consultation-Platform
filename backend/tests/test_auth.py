import pytest
from datetime import datetime, timezone
from httpx import AsyncClient
from unittest.mock import patch, MagicMock

from auth import create_jwt_token, decode_jwt_token
from models import User
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


@pytest.mark.asyncio
async def test_root(client: AsyncClient):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Xasread API"


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_google_auth_no_credentials(client: AsyncClient):
    with patch("auth.settings") as mock_settings:
        mock_settings.google_client_id = ""
        mock_settings.google_client_secret = ""
        mock_settings.jwt_secret = "test-secret"
        response = await client.get("/auth/google", follow_redirects=False)
        assert response.status_code == 500
        assert "not configured" in response.json()["detail"]


@pytest.mark.asyncio
async def test_google_auth_redirect(client: AsyncClient, mock_google_oauth):
    response = await client.get("/auth/google", follow_redirects=False)
    assert response.status_code == 307
    location = response.headers.get("location")
    assert "accounts.google.com" in location
    assert "client_id=" in location
    assert "redirect_uri=" in location
    assert "scope=" in location


@pytest.mark.asyncio
async def test_callback_no_code(client: AsyncClient):
    response = await client.get("/auth/google/callback")
    assert response.status_code == 400
    assert "Missing authorization code" in response.json()["detail"]


@pytest.mark.asyncio
async def test_callback_invalid_code(client: AsyncClient, mock_google_oauth):
    import auth as auth_module
    state = "test_state_123"
    auth_module.oauth_states[state] = datetime.now(timezone.utc)

    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.json.return_value = {"error": "invalid_grant"}
    mock_google_oauth.post.return_value = mock_response

    response = await client.get(f"/auth/google/callback?code=invalid_code&state={state}")
    assert response.status_code == 400
    assert "Failed to exchange code" in response.json()["detail"]


@pytest.mark.asyncio
async def test_callback_valid_code(client: AsyncClient, mock_google_oauth, db_session: AsyncSession):
    import auth as auth_module
    state = "test_state_valid"
    auth_module.oauth_states[state] = datetime.now(timezone.utc)

    response = await client.get(f"/auth/google/callback?code=valid_code&state={state}", follow_redirects=False)
    assert response.status_code == 307
    location = response.headers.get("location")
    assert "token=" in location

    token = location.split("token=")[1]
    user_id = decode_jwt_token(token)
    assert user_id is not None

    result = await db_session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    assert user is not None
    assert user.email == "user@gmail.com"
    assert user.name == "Google User"
    assert user.google_id == "google_user_123"


@pytest.mark.asyncio
async def test_me_no_token(client: AsyncClient):
    response = await client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["is_authenticated"] is False
    assert data["user"] is None


@pytest.mark.asyncio
async def test_me_invalid_token(client: AsyncClient):
    response = await client.get("/auth/me", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_authenticated"] is False
    assert data["user"] is None


@pytest.mark.asyncio
async def test_me_valid_token(client: AsyncClient, test_user: User, auth_headers: dict):
    response = await client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["is_authenticated"] is True
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["name"] == "Test User"


@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    response = await client.post("/auth/logout")
    assert response.status_code == 200
    assert "Logged out" in response.json()["message"]


@pytest.mark.asyncio
async def test_guest_login(client: AsyncClient):
    response = await client.get("/auth/guest")
    assert response.status_code == 200
    data = response.json()
    assert data["is_authenticated"] is True
    assert data["is_guest"] is True
    assert data["user"] is None


@pytest.mark.asyncio
async def test_user_created_on_first_login(client: AsyncClient, mock_google_oauth, db_session: AsyncSession):
    import auth as auth_module
    state = "test_state_first"
    auth_module.oauth_states[state] = datetime.now(timezone.utc)

    result_before = await db_session.execute(select(User).where(User.google_id == "google_user_123"))
    assert result_before.scalar_one_or_none() is None

    await client.get(f"/auth/google/callback?code=valid_code&state={state}", follow_redirects=False)

    result_after = await db_session.execute(select(User).where(User.google_id == "google_user_123"))
    user = result_after.scalar_one_or_none()
    assert user is not None
    assert user.email == "user@gmail.com"


@pytest.mark.asyncio
async def test_user_updated_on_subsequent_login(client: AsyncClient, db_session: AsyncSession):
    import auth as auth_module
    state = "test_state_update"
    auth_module.oauth_states[state] = datetime.now(timezone.utc)

    mock_token_response = MagicMock()
    mock_token_response.status_code = 200
    mock_token_response.json.return_value = {"access_token": "mock_token"}

    mock_userinfo_response = MagicMock()
    mock_userinfo_response.status_code = 200
    mock_userinfo_response.json.return_value = {
        "id": "google_user_123",
        "email": "user@gmail.com",
        "name": "Updated Name",
        "picture": "https://example.com/new_pic.jpg",
    }

    with patch("auth.settings") as mock_settings:
        mock_settings.google_client_id = "test_client_id"
        mock_settings.google_client_secret = "test_client_secret"
        mock_settings.google_token_url = "https://oauth2.googleapis.com/token"
        mock_settings.google_userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        mock_settings.google_redirect_uri = "http://localhost:8000/auth/google/callback"
        mock_settings.frontend_url = "http://localhost:5173"
        mock_settings.jwt_secret = "test-jwt-secret-key-32-chars-long!!!"
        mock_settings.jwt_expiry_hours = 24

        with patch("auth.httpx.AsyncClient") as mock_client:
            instance = mock_client.return_value.__aenter__.return_value
            instance.post.return_value = mock_token_response
            instance.get.return_value = mock_userinfo_response

            await client.get(f"/auth/google/callback?code=valid_code&state={state}", follow_redirects=False)

            result = await db_session.execute(select(User).where(User.google_id == "google_user_123"))
            user = result.scalar_one_or_none()
            assert user is not None
            assert user.name == "Updated Name"
            assert user.avatar_url == "https://example.com/new_pic.jpg"

            count_result = await db_session.execute(select(User).where(User.google_id == "google_user_123"))
            users = count_result.scalars().all()
            assert len(users) == 1


@pytest.mark.asyncio
async def test_jwt_token_decode(test_user: User):
    token = create_jwt_token(test_user.id)
    decoded_id = decode_jwt_token(token)
    assert decoded_id == test_user.id


@pytest.mark.asyncio
async def test_jwt_token_invalid():
    result = decode_jwt_token("invalid.token.here")
    assert result is None


@pytest.mark.asyncio
async def test_jwt_token_expired():
    import jwt
    from datetime import datetime, timedelta, timezone
    from config import settings

    payload = {
        "sub": "user_id",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    result = decode_jwt_token(token)
    assert result is None