import asyncio
import uuid
from typing import AsyncGenerator
from unittest.mock import patch, MagicMock, PropertyMock

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from main import app
from database import Base, get_db
from models import User
from auth import create_jwt_token

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        id=str(uuid.uuid4()),
        email="test@example.com",
        name="Test User",
        avatar_url="https://example.com/avatar.jpg",
        google_id="123456789",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
def auth_headers(test_user: User) -> dict:
    token = create_jwt_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
def mock_google_oauth():
    mock_token_response = MagicMock()
    mock_token_response.status_code = 200
    mock_token_response.json.return_value = {
        "access_token": "mock_access_token",
        "token_type": "Bearer",
        "expires_in": 3600,
    }

    mock_userinfo_response = MagicMock()
    mock_userinfo_response.status_code = 200
    mock_userinfo_response.json.return_value = {
        "id": "google_user_123",
        "email": "user@gmail.com",
        "name": "Google User",
        "picture": "https://example.com/picture.jpg",
    }

    with patch("auth.settings") as mock_settings:
        mock_settings.google_client_id = "test_client_id"
        mock_settings.google_client_secret = "test_client_secret"
        mock_settings.google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
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
            yield instance