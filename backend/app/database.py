import ssl

from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool
from sqlalchemy.engine import make_url

from config import settings

_db_initialized = False
_db_init_error: Exception | None = None
_engine: AsyncEngine | None = None
_session_maker: async_sessionmaker[AsyncSession] | None = None


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    parsed = make_url(url)
    if parsed.drivername == "postgresql+asyncpg":
        return parsed.set(query={}).render_as_string(hide_password=False)
    return str(parsed)


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        connect_args = {}
        if settings.database_url.startswith(("postgres://", "postgresql://")):
            connect_args["ssl"] = ssl.create_default_context()
        _engine = create_async_engine(
            normalize_database_url(settings.database_url),
            echo=False,
            future=True,
            poolclass=NullPool,
            connect_args=connect_args,
        )
    return _engine


def get_session_maker() -> async_sessionmaker[AsyncSession]:
    global _session_maker
    if _session_maker is None:
        _session_maker = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_maker


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    await ensure_db_initialized()
    async with get_session_maker() as session:
        yield session


async def init_db() -> None:
    global _db_initialized, _db_init_error
    if _db_initialized:
        return
    async with get_engine().begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    _db_initialized = True
    _db_init_error = None


async def ensure_db_initialized() -> None:
    if _db_initialized:
        return
    await init_db()


async def try_init_db() -> str:
    global _db_init_error
    try:
        await init_db()
    except Exception as exc:
        _db_init_error = exc
        return f"database_unavailable: {type(exc).__name__}"
    return "ready"


def get_db_status() -> dict[str, str]:
    if _db_initialized:
        return {"database": "ready"}
    if _db_init_error:
        return {
            "database": "unavailable",
            "error": type(_db_init_error).__name__,
        }
    return {"database": "not_initialized"}
