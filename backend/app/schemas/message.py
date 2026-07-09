from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional


class FindingSchema(BaseModel):
    id: str
    label: str
    confidence: float
    color: str
    x: float
    y: float
    w: float
    h: float


class ImageData(BaseModel):
    fileName: str
    findings: list[FindingSchema] = []


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
    content_plain: Optional[str] = None
    content_standard: Optional[str] = None
    content_clinical: Optional[str] = None
    image: Optional[ImageData] = None
    created_at: Optional[datetime] = None