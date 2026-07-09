from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional
from app.schemas.message import MessageOut


class ConversationCreate(BaseModel):
    title: str = "New Consultation"


class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    message_count: int = 0


class ConversationDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    messages: list[MessageOut] = []