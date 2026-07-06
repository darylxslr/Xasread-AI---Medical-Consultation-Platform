import pytest
from httpx import AsyncClient

from models import User
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.asyncio
async def test_list_messages_empty(client: AsyncClient, test_user: User, auth_headers: dict):
    create_resp = await client.post(
        "/conversations",
        json={"title": "Message Test"},
        headers=auth_headers,
    )
    conv_id = create_resp.json()["id"]

    response = await client.get(f"/conversations/{conv_id}/messages", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_message(client: AsyncClient, test_user: User, auth_headers: dict):
    create_resp = await client.post(
        "/conversations",
        json={"title": "Message Test"},
        headers=auth_headers,
    )
    conv_id = create_resp.json()["id"]

    response = await client.post(
        f"/conversations/{conv_id}/messages",
        json={"role": "user", "content": "I have a cough"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "user"
    assert data["content"] == "I have a cough"
    assert "id" in data


@pytest.mark.asyncio
async def test_list_messages_after_create(client: AsyncClient, test_user: User, auth_headers: dict):
    create_resp = await client.post(
        "/conversations",
        json={"title": "Multi Msg"},
        headers=auth_headers,
    )
    conv_id = create_resp.json()["id"]

    await client.post(
        f"/conversations/{conv_id}/messages",
        json={"role": "user", "content": "Hello"},
        headers=auth_headers,
    )
    await client.post(
        f"/conversations/{conv_id}/messages",
        json={"role": "assistant", "content": "Hi there"},
        headers=auth_headers,
    )

    response = await client.get(f"/conversations/{conv_id}/messages", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["content"] == "Hello"
    assert data[1]["content"] == "Hi there"


@pytest.mark.asyncio
async def test_messages_requires_auth(client: AsyncClient):
    response = await client.get("/conversations/some_id/messages")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_message_conversation_not_found(client: AsyncClient, test_user: User, auth_headers: dict):
    response = await client.post(
        "/conversations/nonexistent/messages",
        json={"role": "user", "content": "Test"},
        headers=auth_headers,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_user_cannot_access_other_users_messages(
    client: AsyncClient, test_user: User, auth_headers: dict, db_session: AsyncSession
):
    from models import User, Conversation

    other_user = User(
        email="other2@example.com",
        name="Other User 2",
        google_id="other_google_id_2",
    )
    db_session.add(other_user)
    await db_session.commit()
    await db_session.refresh(other_user)

    other_conv = Conversation(user_id=other_user.id, title="Other Conv")
    db_session.add(other_conv)
    await db_session.commit()
    await db_session.refresh(other_conv)

    response = await client.get(
        f"/conversations/{other_conv.id}/messages",
        headers=auth_headers,
    )
    assert response.status_code == 404

    response = await client.post(
        f"/conversations/{other_conv.id}/messages",
        json={"role": "user", "content": "Hack attempt"},
        headers=auth_headers,
    )
    assert response.status_code == 404