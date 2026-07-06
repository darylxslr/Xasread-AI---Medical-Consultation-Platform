import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock

from models import User, Conversation
from database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


@pytest.mark.asyncio
async def test_list_conversations_empty(client: AsyncClient, test_user: User, auth_headers: dict):
    response = await client.get("/conversations", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_conversation(client: AsyncClient, test_user: User, auth_headers: dict):
    response = await client.post(
        "/conversations",
        json={"title": "Test Consultation"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Consultation"
    assert "id" in data
    assert data["messages"] == []


@pytest.mark.asyncio
async def test_list_conversations_after_create(client: AsyncClient, test_user: User, auth_headers: dict):
    await client.post(
        "/conversations",
        json={"title": "First Consultation"},
        headers=auth_headers,
    )
    await client.post(
        "/conversations",
        json={"title": "Second Consultation"},
        headers=auth_headers,
    )

    response = await client.get("/conversations", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["title"] == "Second Consultation"
    assert data[1]["title"] == "First Consultation"


@pytest.mark.asyncio
async def test_get_conversation(client: AsyncClient, test_user: User, auth_headers: dict):
    create_resp = await client.post(
        "/conversations",
        json={"title": "Get Test"},
        headers=auth_headers,
    )
    conv_id = create_resp.json()["id"]

    response = await client.get(f"/conversations/{conv_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "Get Test"
    assert response.json()["messages"] == []


@pytest.mark.asyncio
async def test_get_conversation_not_found(client: AsyncClient, test_user: User, auth_headers: dict):
    response = await client.get("/conversations/nonexistent", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_conversation(client: AsyncClient, test_user: User, auth_headers: dict):
    create_resp = await client.post(
        "/conversations",
        json={"title": "Delete Test"},
        headers=auth_headers,
    )
    conv_id = create_resp.json()["id"]

    response = await client.delete(f"/conversations/{conv_id}", headers=auth_headers)
    assert response.status_code == 200

    get_resp = await client.get(f"/conversations/{conv_id}", headers=auth_headers)
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_update_conversation(client: AsyncClient, test_user: User, auth_headers: dict):
    create_resp = await client.post(
        "/conversations",
        json={"title": "Old Title"},
        headers=auth_headers,
    )
    conv_id = create_resp.json()["id"]

    response = await client.patch(
        f"/conversations/{conv_id}",
        json={"title": "New Title"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "New Title"


@pytest.mark.asyncio
async def test_conversations_requires_auth(client: AsyncClient):
    response = await client.get("/conversations")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_conversation_requires_auth(client: AsyncClient):
    response = await client.post("/conversations", json={"title": "Test"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_user_cannot_access_other_users_conversation(
    client: AsyncClient, test_user: User, auth_headers: dict, db_session: AsyncSession
):
    other_user = User(
        email="other@example.com",
        name="Other User",
        google_id="other_google_id",
    )
    db_session.add(other_user)
    await db_session.commit()
    await db_session.refresh(other_user)

    other_conv = Conversation(user_id=other_user.id, title="Other User's Conv")
    db_session.add(other_conv)
    await db_session.commit()
    await db_session.refresh(other_conv)

    response = await client.get(f"/conversations/{other_conv.id}", headers=auth_headers)
    assert response.status_code == 404

    response = await client.delete(f"/conversations/{other_conv.id}", headers=auth_headers)
    assert response.status_code == 404