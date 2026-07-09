import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from config import settings
from database import get_db
from models import User, Conversation, Message
from schemas import MessageCreate, MessageOut, RephraseRequest
from auth import get_current_user

router = APIRouter(prefix="/conversations", tags=["chat"])

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODELS = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"]

BASE_SYSTEM_PROMPT = """You are Xasread AI, a medical consultation assistant. You help users understand their symptoms, provide medical information, and guide them toward appropriate care.

IMPORTANT DISCLAIMERS (always include when relevant):
- You are an AI assistant, not a doctor. Your responses are for informational purposes only.
- Always recommend consulting a healthcare professional for diagnosis and treatment.
- In emergencies, advise calling emergency services immediately.

RESPONSE STRUCTURE:
- Use clean section breaks between different topics
- Each paragraph: 2-4 sentences, one idea per paragraph
- Use numbered steps (1. 2. 3.) for procedures or sequences
- Use `-` bullet points for lists or options
- Separate sections with a blank line
- Bold **key terms** once on first mention
- Never use asterisk `*` — use `-` for bullets
- Keep indentation clean and consistent
- Use formal, professional language throughout"""

MODE_PROMPTS = {
    "simple": "The user has limited medical knowledge. Use extremely simple, plain language. Explain all medical terms in everyday words. Use analogies and simple comparisons. Avoid medical jargon entirely. Be extra patient and encouraging.",
    "standard": "Keep responses balanced. Use plain language that most people can understand. Briefly explain any necessary medical terms. Be empathetic and reassuring while being honest about limitations.",
    "advanced": "The user is a medical professional or has advanced medical knowledge. Use proper medical terminology. Include relevant clinical details, differentials, and evidence-based reasoning. Be precise and technical where appropriate. No need to explain basic medical concepts.",
    "concise": "Be extremely brief. Use bullet points or short paragraphs (max 2-3 sentences each). Avoid explanations unless the user asks. Get straight to the point.",
    "detailed": "Provide thorough, comprehensive explanations. Include relevant medical context, possible differentials, and detailed guidance. Use multiple sections with clear headings. Support claims with reasoning.",
}

def get_system_prompt(mode: str = "standard") -> str:
    extra = MODE_PROMPTS.get(mode, MODE_PROMPTS["standard"])
    return f"{BASE_SYSTEM_PROMPT}\n\n{extra}"


class FileInfo(BaseModel):
    name: str
    data: str

class GuestChatRequest(BaseModel):
    content: str
    mode: str = "standard"
    file: FileInfo | None = None


class GuestChatResponse(BaseModel):
    role: str = "assistant"
    content: str


async def try_groq_model(model: str, messages: list[dict]) -> str | None:
    if not settings.groq_api_key:
        return None
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{GROQ_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
    except Exception:
        return None
    return None


def build_file_context(file: FileInfo | None, user_content: str) -> str:
    if not file:
        return user_content
    if file.data.startswith("data:image/"):
        return f"[Uploaded image: {file.name}]\n\n{user_content}"
    if file.data.startswith("data:application/pdf"):
        return f"[Uploaded document: {file.name}]\n\n{user_content}"
    return f"[Uploaded file: {file.name}]\nContents:\n{file.data}\n\n{user_content}"

async def get_ai_response(user_content: str, history: list[dict], mode: str = "standard", file: FileInfo | None = None) -> str:
    enriched = build_file_context(file, user_content)
    messages = [{"role": "system", "content": get_system_prompt(mode)}]
    for msg in history[:-1]:
        role = "user" if msg.get("role") == "user" else "assistant"
        content = "".join(msg.get("parts", [])) if isinstance(msg.get("parts"), list) else str(msg.get("parts", ""))
        messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": enriched})

    for model in GROQ_MODELS:
        result = await try_groq_model(model, messages)
        if result is not None:
            return result

    return "I apologize, but the AI service is temporarily unavailable. Please try again in a moment."


@router.post("/guest-chat", response_model=GuestChatResponse)
async def guest_chat(data: GuestChatRequest):
    content = await get_ai_response(data.content, [], data.mode, data.file)
    return GuestChatResponse(content=content)


@router.post("/{conv_id}/chat", response_model=MessageOut, status_code=201)
async def chat_message(
    conv_id: str,
    data: MessageCreate,
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if data.role != "user":
        raise HTTPException(status_code=400, detail="Only user messages are accepted")

    conv_result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.user_id == user.id)
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_content = data.content
    if data.file:
        user_content = f"[Uploaded file: {data.file.name}]\n{data.content}"
    user_msg = Message(conversation_id=conv_id, role="user", content=user_content)
    db.add(user_msg)

    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv_id)
        .order_by(Message.created_at)
    )
    history = history_result.scalars().all()

    groq_history = []
    for msg in history:
        role = "user" if msg.role == "user" else "assistant"
        groq_history.append({"role": role, "parts": [msg.content]})

    ai_content = await get_ai_response(data.content, groq_history, data.mode, data.file)

    ai_msg = Message(conversation_id=conv_id, role="assistant", content=ai_content)
    db.add(ai_msg)

    conv.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(ai_msg)

    return MessageOut.model_validate(ai_msg)


REPHRASE_PROMPTS = {
    "simple": "Reformulate the following medical response at a simple level. The user has no medical knowledge. Use extremely simple language, explain all terms, avoid jargon entirely. Keep the same facts and recommendations.\n\nOriginal response:\n",
    "standard": "Reformulate the following medical response at a standard level. The user has general health knowledge. Use plain language, briefly explain any necessary terms. Keep the same facts and recommendations.\n\nOriginal response:\n",
    "advanced": "Reformulate the following medical response at an advanced level. The user is a medical professional or has strong medical background. Use proper medical terminology and clinical detail. Keep the same facts and recommendations.\n\nOriginal response:\n",
}


@router.post("/{conv_id}/rephrase", response_model=MessageOut)
async def rephrase_message(
    conv_id: str,
    data: RephraseRequest,
    user: User | None = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    msg_result = await db.execute(
        select(Message).where(
            Message.id == data.message_id,
            Message.conversation_id == conv_id,
            Message.role == "assistant",
        )
    )
    msg = msg_result.scalar_one_or_none()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    prompt = REPHRASE_PROMPTS.get(data.level)
    if not prompt:
        raise HTTPException(status_code=400, detail="Invalid level")

    rephrased = await try_groq_model(
        GROQ_MODELS[0],
        [{"role": "user", "content": prompt + msg.content}],
    )
    if not rephrased:
        raise HTTPException(status_code=502, detail="Rephrase service unavailable")

    msg.content = rephrased
    conv_result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = conv_result.scalar_one_or_none()
    if conv:
        conv.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(msg)
    return MessageOut.model_validate(msg)


