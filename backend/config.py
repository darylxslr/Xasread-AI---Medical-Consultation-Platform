import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    database_url: str = Field(
        default_factory=lambda: "sqlite+aiosqlite:////tmp/xasread.db"
        if os.getenv("VERCEL")
        else "sqlite+aiosqlite:///./xasread.db"
    )
    google_client_id: str = Field(default="")
    google_client_secret: str = Field(default="")
    jwt_secret: str = Field(default="xasread-dev-secret-change-in-production-32bytes!")
    jwt_expiry_hours: int = Field(default=8760)
    frontend_url: str = Field(default="http://localhost:5173")
    google_redirect_uri:  str = Field(default="http://localhost:8000/auth/google/callback")
    google_auth_url: str = Field(default="https://accounts.google.com/o/oauth2/v2/auth")
    google_token_url: str = Field(default="https://oauth2.googleapis.com/token")
    google_userinfo_url: str = Field(default="https://www.googleapis.com/oauth2/v2/userinfo")
    groq_api_key: str = Field(default="")
    gemini_api_key: str = Field(default="")


settings = Settings()
