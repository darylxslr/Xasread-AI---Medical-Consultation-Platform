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