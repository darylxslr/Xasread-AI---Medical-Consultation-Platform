from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas.message import MessageCreate, MessageOut
from app.core.security import get_current_user

router = APIRouter(prefix="/conversations", tags=["messages"])


@router.get("/{conv_id}/messages", response_model=list[MessageOut])
async def list_messages(
    conv_id: str,
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 100,
    offset: int = 0,
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == user.id)
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at).offset(offset).limit(limit)
    )
    msgs = [MessageOut.model_validate(m) for m in msgs_result.scalars().all()]
    return msgs


@router.post("/{conv_id}/messages", response_model=MessageOut, status_code=201)
async def create_message(
    conv_id: str,
    data: MessageCreate,
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == user.id)
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg = Message(conversation_id=conv_id, role=data.role, content=data.content)
    db.add(msg)
    conv.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(msg)
    return MessageOut.model_validate(msg)


