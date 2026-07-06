from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from auth import router as auth_router
from conversations import router as conversations_router
from messages import router as messages_router
from chat import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Xasread API",
    description="AI Medical Consultation Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
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
    return {"status": "healthy"}