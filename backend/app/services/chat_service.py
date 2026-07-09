import json
import re
import httpx
from dataclasses import dataclass
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from app.models import Conversation, Message
from app.schemas.message import ImageData, FindingSchema
from app.services.vision_service import gemini_analyze_image

GROQ_BASE_URL = "https://api.groq.com/openai/v1"

MODE_PRIMARY_MODELS = {
    "plain":     "llama-3.3-70b-versatile",
    "standard":  "llama-3.3-70b-versatile",
    "clinical":  "deepseek-r1-distill-llama-70b",
}

FALLBACK_CHAIN = ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"]

MODE_PARAMS = {
    "plain":    {"temperature": 0.5, "max_tokens": 1024},
    "standard": {"temperature": 0.7, "max_tokens": 1024},
    "clinical": {"temperature": 0.8, "max_tokens": 2048},
}

IMAGE_PARAMS = {"model": "llama-3.2-11b-vision-preview", "temperature": 0.6, "max_tokens": 2048}

FULL_MODE_PROMPTS = {
    "plain": """You are Xasread AI, a friendly health guide helping patients understand their symptoms.

Answer warmly in simple, everyday language. Be accurate and credible. Include a brief disclaimer where appropriate.

Use **bold** for medical terms and key findings, *italic* for symptoms and mild emphasis. Apply these styles consistently throughout your response. Use emojis, bullet points, and separators naturally where they improve readability. Format your response with clean spacing and proper paragraphs.""",

    "standard": """You are Xasread AI, a professional medical consultation assistant helping users understand their health concerns.

Answer clearly in balanced, professional language. Be accurate and credible. Include a brief disclaimer.

Use **bold** for medical terms and key findings, *italic* for symptoms and mild emphasis. Apply these styles consistently throughout your response. Use emojis, bullet points, and separators naturally where they improve readability. Format with clean spacing and proper paragraphs.""",

    "clinical": """You are Xasread AI Clinical, a decision support system for healthcare professionals.

Answer with precise medical terminology and clinical reasoning. Be accurate and credible. Include a brief disclaimer.

Use **bold** for medical terms and key findings, *italic* for symptoms and mild emphasis. Apply these styles consistently throughout your response. Use emojis, bullet points, and separators naturally where they improve readability. Format with clean spacing and proper paragraphs.""",
}

IMAGE_ANALYSIS_PROMPT = """You are Xasread AI, a professional medical imaging assistant.

Analyze the uploaded medical image and correlate it with the user's described symptoms. Be accurate and credible. Start with a brief disclaimer.

Use **bold** for medical terms and key findings, *italic* for symptoms and mild emphasis. Apply these styles consistently throughout your response. Use emojis, bullet points, tables, and separators naturally where they improve readability. Format with clean spacing and proper paragraphs.

After your analysis, include a structured findings block at the end of your response in this exact format:

<findings>
[
  {"id": "f1", "label": "Finding name", "confidence": 87, "color": "orange", "x": 0.1, "y": 0.2, "w": 0.3, "h": 0.4}
]
</findings>

Each finding must have: id (f1, f2, ...), label (short description), confidence (0-100), color ("orange"/"blue"/"green"), and bounding box (x, y, w, h as 0-1 normalized ratios). Include 0 findings if nothing abnormal is detected."""

REPHRASE_PROMPTS = {
    "plain": "Reformulate the following medical response at a simple patient level. Use warm plain language. Explain medical terms with analogies. Keep same facts and recommendations. Be consistent with **bold** and *italic* styles. Format with clean spacing.\n\nOriginal response:\n",
    "standard": "Reformulate the following medical response at a standard level. Use balanced professional language. Briefly explain necessary terms. Keep same facts and recommendations. Be consistent with **bold** and *italic* styles. Format with clean spacing.\n\nOriginal response:\n",
    "clinical": "Reformulate the following medical response at a clinical level. Use proper medical terminology. Include clinical detail. Do not explain basic concepts. Keep same facts and recommendations. Add ICD-10 codes where appropriate. Be consistent with **bold** and *italic* styles. Format with clean spacing.\n\nOriginal response:\n",
}


@dataclass
class AIResponse:
    content: str
    image: ImageData | None = None


def get_system_prompt(mode: str = "standard", has_file: bool = False) -> str:
    if has_file:
        return IMAGE_ANALYSIS_PROMPT
    return FULL_MODE_PROMPTS.get(mode, FULL_MODE_PROMPTS["standard"])


def get_model_chain(mode: str = "standard", has_file: bool = False) -> tuple[str, float, int]:
    if has_file:
        return IMAGE_PARAMS["model"], IMAGE_PARAMS["temperature"], IMAGE_PARAMS["max_tokens"]

    primary = MODE_PRIMARY_MODELS.get(mode, "llama-3.3-70b-versatile")
    params = MODE_PARAMS.get(mode, MODE_PARAMS["standard"])
    return primary, params["temperature"], params["max_tokens"]


def build_vision_messages(messages: list[dict], file) -> list[dict]:
    if not file or not file.data.startswith("data:image/"):
        return messages
    result = []
    for msg in messages:
        if msg.get("role") == "user" and isinstance(msg.get("content"), str):
            msg = {
                "role": "user",
                "content": [
                    {"type": "text", "text": msg["content"]},
                    {"type": "image_url", "image_url": {"url": file.data}},
                ],
            }
        result.append(msg)
    return result


def parse_findings(text: str) -> tuple[str, list[dict]]:
    match = re.search(r"<findings>\s*(.*?)\s*</findings>", text, re.DOTALL)
    if not match:
        return text, []
    try:
        findings = json.loads(match.group(1))
        if not isinstance(findings, list):
            findings = []
    except (json.JSONDecodeError, TypeError):
        findings = []
    clean = re.sub(r"\s*<findings>.*?</findings>\s*", "", text, flags=re.DOTALL).strip()
    return clean, findings


async def try_groq_model(model: str, messages: list[dict], temperature: float = 0.7, max_tokens: int = 1024, file=None) -> str | None:
    if not settings.groq_api_key:
        return None
    try:
        payload_messages = build_vision_messages(messages, file) if file else messages
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{GROQ_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": payload_messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
    except Exception:
        return None
    return None


def build_file_context(file, user_content: str) -> str:
    if not file:
        return user_content
    if file.data.startswith("data:image/"):
        return f"[Uploaded image: {file.name}]\n\n{user_content}"
    if file.data.startswith("data:application/pdf"):
        return f"[Uploaded document: {file.name}]\n\n{user_content}"
    return f"[Uploaded file: {file.name}]\nContents:\n{file.data}\n\n{user_content}"


async def get_ai_response(user_content: str, history: list[dict], mode: str = "standard", file=None) -> AIResponse:
    has_file = file is not None

    if has_file and file.data.startswith("data:image/") and settings.gemini_api_key:
        enriched = build_file_context(file, user_content)
        system_prompt = get_system_prompt(mode, True)
        full_prompt = f"{system_prompt}\n\nUser's description: {enriched}"
        clean_text, findings_data = await gemini_analyze_image(
            settings.gemini_api_key, file.data, full_prompt
        )
        if clean_text is not None:
            image = ImageData(
                fileName=file.name,
                findings=[FindingSchema(**f) for f in findings_data],
            )
            return AIResponse(content=clean_text, image=image)
        return AIResponse(content="I apologize, but the AI service is temporarily unavailable. Please try again in a moment.")

    enriched = build_file_context(file, user_content)

    messages = [{"role": "system", "content": get_system_prompt(mode, has_file)}]
    for msg in history[:-1]:
        role = "user" if msg.get("role") == "user" else "assistant"
        content = "".join(msg.get("parts", [])) if isinstance(msg.get("parts"), list) else str(msg.get("parts", ""))
        messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": enriched})

    primary_model, temperature, max_tokens = get_model_chain(mode, has_file)
    models = [primary_model] + [m for m in FALLBACK_CHAIN if m != primary_model]

    for model in models:
        result = await try_groq_model(model, messages, temperature, max_tokens, file)
        if result is not None:
            clean, findings_data = parse_findings(result)
            image = None
            if has_file and file.data.startswith("data:image/"):
                image = ImageData(
                    fileName=file.name,
                    findings=[FindingSchema(**f) for f in findings_data],
                )
            return AIResponse(content=clean, image=image)

    return AIResponse(content="I apologize, but the AI service is temporarily unavailable. Please try again in a moment.")


async def save_message(db: AsyncSession, conversation_id: str, role: str, content: str) -> Message:
    msg = Message(conversation_id=conversation_id, role=role, content=content)
    db.add(msg)
    conv_result = await db.execute(select(Conversation).where(Conversation.id == conversation_id))
    conv = conv_result.scalar_one_or_none()
    if conv:
        conv.updated_at = datetime.now(timezone.utc)
    return msg
