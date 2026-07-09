from pydantic import BaseModel, ConfigDict
from typing import Optional


class UserSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    theme: str = "light"
    font_size: str = "medium"
    chat_mode: str = "standard"


class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    font_size: Optional[str] = None
    chat_mode: Optional[str] = None