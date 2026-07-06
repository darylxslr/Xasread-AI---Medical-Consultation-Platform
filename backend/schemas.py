from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class AuthStatus(BaseModel):
    is_authenticated: bool
    is_guest: bool
    user: Optional[UserOut] = None


class ErrorResponse(BaseModel):
    detail: str


class ConversationCreate(BaseModel):
    title: str = "New Consultation"


class FileInfo(BaseModel):
    name: str
    data: str

class MessageCreate(BaseModel):
    role: str
    content: str
    mode: str = "standard"
    file: FileInfo | None = None


class RephraseRequest(BaseModel):
    message_id: str
    level: str

class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    created_at: Optional[datetime] = None


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


class UserSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    theme: str = "light"
    font_size: str = "medium"
    chat_mode: str = "standard"


class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    font_size: Optional[str] = None
    chat_mode: Optional[str] = None