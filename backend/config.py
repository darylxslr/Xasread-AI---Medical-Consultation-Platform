# pydantic-settings v2 style, already using Field
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    database_url: str = Field(default="sqlite+aiosqlite:///./xasread.db")
    google_client_id: str = Field(default="")
    google_client_secret: str = Field(default="")
    jwt_secret: str = Field(default="xasread-dev-secret-change-in-production-32bytes!")
    jwt_expiry_hours: int = Field(default=8760)
    frontend_url: str = Field(default="http://localhost:5173")
    google_redirect_uri:  str = Field(default="http://localhost:8000/auth/google/callback")
    groq_api_key: str = Field(default="")
    gemini_api_key: str = Field(default="")