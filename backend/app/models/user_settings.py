from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    theme = Column(String, default="system")
    font_size = Column(String, default="medium")
    chat_mode = Column(String, default="standard")

    user = relationship("User", back_populates="settings")