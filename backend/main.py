from pathlib import Path
import sys
from contextlib import asynccontextmanager

BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from app.database import get_db_status, try_init_db
from app.api.v1.auth import router as auth_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.messages import router as messages_router
from app.api.v1.chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await try_init_db()
    yield


app = FastAPI(
    title="Xasread API",
    description="AI Medical Consultation Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth_router)
app.include_router(conversations_router)
app.include_router(messages_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "Xasread API"}


@app.get("/health")
async def health():
    return {"status": "healthy", **get_db_status()}
