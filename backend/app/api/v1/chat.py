from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from config import settings
from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas.message import MessageCreate, MessageOut, RephraseRequest, FileInfo, ImageData
from app.core.security import get_current_user
from app.services.chat_service import get_ai_response

router = APIRouter(prefix="/conversations", tags=["chat"])


class GuestChatRequest(BaseModel):
    content: str
    mode: str = "standard"
    file: FileInfo | None = None


class GuestChatResponse(BaseModel):
    role: str = "assistant"
    content: str
    image: ImageData | None = None


@router.post("/guest-chat", response_model=GuestChatResponse)
async def guest_chat(data: GuestChatRequest):
    result = await get_ai_response(data.content, [], data.mode, data.file)
    return GuestChatResponse(content=result.content, image=result.image)


@router.post("/{conv_id}/chat", response_model=MessageOut, status_code=201)
async def chat_message(
    conv_id: str,
    data: MessageCreate,
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if data.role != "user":
        raise HTTPException(status_code=400, detail="Only user messages are accepted")

    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == user.id)
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_content = data.content
    if data.file:
        user_content = f"[Uploaded file: {data.file.name}]\n{data.content}"
    user_msg = Message(conversation_id=conv_id, role="user", content=user_content)
    db.add(user_msg)

    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at)
    )
    history = history_result.scalars().all()

    groq_history = []
    for msg in history:
        role = "user" if msg.role == "user" else "assistant"
        groq_history.append({"role": role, "parts": [msg.content]})

    result = await get_ai_response(data.content, groq_history, data.mode, data.file)

    ai_msg = Message(conversation_id=conv_id, role="assistant", content=result.content)
    if data.file:
        ai_msg.image_data = data.file.data
        ai_msg.image_file_name = data.file.name
    content_field = f"content_{data.mode}"
    setattr(ai_msg, content_field, result.content)
    db.add(ai_msg)
    conv.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(ai_msg)

    msg_out = MessageOut.model_validate(ai_msg)
    msg_out.image = result.image
    return msg_out


@router.post("/{conv_id}/rephrase", response_model=MessageOut)
async def rephrase_message(
    conv_id: str,
    data: RephraseRequest,
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    msg_result = await db.execute(
        select(Message).where(
            Message.id == data.message_id,
            Message.conversation_id == conv_id,
            Message.role == "assistant",
        )
    )
    msg = msg_result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    content_field = f"content_{data.level}"
    cached = getattr(msg, content_field, None)
    if cached:
        msg.content = cached
        await db.commit()
        await db.refresh(msg)
        return MessageOut.model_validate(msg)

    prev_msgs_result = await db.execute(
        select(Message)
        .where(
            Message.conversation_id == conv_id,
            Message.created_at < msg.created_at,
            Message.id != msg.id,
        )
        .order_by(Message.created_at)
    )
    prev_msgs = prev_msgs_result.scalars().all()

    preceding_user_content = None
    groq_history = []
    for m in reversed(prev_msgs):
        if m.role == "user" and preceding_user_content is None:
            preceding_user_content = m.content
        role = "user" if m.role == "user" else "assistant"
        groq_history.append({"role": role, "parts": [m.content]})

    if not preceding_user_content:
        raise HTTPException(status_code=400, detail="No preceding user message found")

    result = await get_ai_response(preceding_user_content, groq_history, data.level)
    setattr(msg, content_field, result.content)
    msg.content = result.content

    conv_result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = conv_result.scalar_one_or_none()
    if conv:
        conv.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(msg)
    return MessageOut.model_validate(msg)
