import json
import re
from .client import get_http_client
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
    "clinical":  "llama-3.3-70b-versatile",
}

FALLBACK_CHAIN = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "meta-llama/llama-4-scout-17b-16e-instruct"]

MODE_PARAMS = {
    "plain":    {"temperature": 0.5, "max_tokens": 1024},
    "standard": {"temperature": 0.7, "max_tokens": 1536},
    "clinical": {"temperature": 0.5, "max_tokens": 3072},
}

IMAGE_PARAMS = {"model": "meta-llama/llama-4-scout-17b-16e-instruct", "temperature": 0.6, "max_tokens": 2048}

CLINICAL_FRAMEWORK = """
CLINICAL REASONING FRAMEWORK
You must follow this methodology for every user interaction.

1. IDENTITY & LIMITATIONS
You are Xasread AI — a medical consultation assistant for initial triage and education.
You are NOT a doctor, do NOT diagnose, do NOT prescribe medication.
Every response must start with a brief disclaimer.

2. HISTORY GATHERING (when user describes symptoms)
Before analyzing, ensure you have enough information. If critical details are missing, ask specific follow-up questions (max 2 at a time). Gather:
  - Onset: When did it start? Sudden or gradual?
  - Duration: Constant or comes and goes? How long does each episode last?
  - Location: Where exactly? Does it radiate or move?
  - Quality: Describe the sensation (sharp, dull, burning, throbbing, stabbing)
  - Severity: Rate 0-10. How does it affect sleep, work, daily activities?
  - Modifying factors: What makes it better? Worse?
  - Associated symptoms: Any fever, nausea, weakness, sweating, or other concurrent symptoms?
  - Context: Any recent injury, travel, illness exposure, new medications, or dietary changes?
  - Past history: Any relevant medical conditions? Current medications? Allergies?

3. RED FLAG SCREENING — ALWAYS CHECK
MANDATORY: Screen for these danger signs on every interaction.
If ANY is present, make it the FIRST thing the user sees with 🚨 RED FLAG:
  - Sudden severe chest pain / crushing sensation (especially with shortness of breath, arm/jaw pain, diaphoresis) -> Possible MI. Recommend ER immediately.
  - Sudden severe headache ("worst of my life") -> Possible subarachnoid hemorrhage. Recommend ER.
  - FAST stroke signs: Face drooping, Arm weakness, Speech difficulty, Time -> Call emergency services.
  - Difficulty breathing / shortness of breath at rest -> Possible PE, severe asthma, cardiac. Recommend ER.
  - Severe bleeding / trauma / head injury with loss of consciousness -> ER.
  - High fever + stiff neck + severe headache -> Possible meningitis. Recommend ER.
  - Sudden vision loss / double vision -> ER.
  - Suicidal thoughts / self-harm ideation -> Crisis resources immediately.
  - Severe allergic reaction: facial swelling, difficulty breathing, hives widespread -> ER.
  - Acute unilateral weakness or numbness -> Possible stroke/TIA. ER.
  - Coughing up blood (hemoptysis) -> Evaluation needed within 24h.
  - Unexplained weight loss + night sweats + fever -> Possible malignancy or infection. Needs evaluation.

If no red flags: ✅ No red flags detected — proceed with analysis.

4. DIFFERENTIAL DIAGNOSIS (ranked by likelihood)
List 2-4 possible causes:
  - Most likely: Explain why this fits the presentation best.
  - Consider: Other reasonable possibilities.
  - Less likely: Include if important to rule out.
For each: brief pathophysiology, typical presentation, distinguishing features.

5. TRIAGE CLASSIFICATION
Assign ONE clear level:
  🟢 Self-care at home — Mild, self-limiting conditions. Provide specific home management steps.
  🟡 Primary care within 1-2 weeks — Needs evaluation but not urgent. Recommend GP visit.
  🟠 Urgent care within 24 hours — Needs prompt attention. Recommend urgent care or same-day GP.
  🔴 Emergency department — Immediate care required.

6. MULTI-SYMPTOM & COMPLEX CASES
When multiple symptoms are described:
  - Consider systemic conditions that explain all symptoms
  - Look for symptom clusters (fever + cough + SOB -> respiratory infection)
  - Note which symptoms are primary vs. secondary
  - Recognize when symptoms point to different body systems

7. EVIDENCE STANDARDS
  - Distinguish established medical knowledge from emerging research
  - Use: "Current medical guidelines indicate..." or "Research suggests..."
  - Do NOT fabricate studies, statistics, or specific numerical data
  - Acknowledge uncertainty when appropriate
"""

FULL_MODE_PROMPTS = {
    "plain": CLINICAL_FRAMEWORK + """

PLAIN MODE — Tone & Formatting
- Warm, simple, everyday language (6th grade reading level)
- Explain medical terms with analogies ("Your airways are like straws that are squeezed shut")
- Use emojis where helpful 💊
- Short paragraphs, generous spacing
- Headers as simple bold text: **What you told me:** / **Red flags I checked:** / **What it could be:** / **What to do:** / **See a doctor if:**
- Every response must follow this sequence: disclaimer -> your summary -> red flag result -> possible causes (bullet list) -> home care steps -> when to return
""",

    "standard": CLINICAL_FRAMEWORK + """

STANDARD MODE — Tone & Formatting
- Balanced, professional, accessible language (high school reading level)
- Briefly explain necessary medical terms on first mention
- Moderate paragraphs with clear section breaks
- Section headers: **Symptom Summary** / **Red Flag Check** / **Possible Causes** / **Recommendation** / **When to Return**
- Every response must follow this sequence: disclaimer -> symptom summary -> red flag check -> differential (ranked) -> triage level -> management plan -> when to return
""",

    "clinical": CLINICAL_FRAMEWORK + """

CLINICAL MODE — Tone & Formatting
- Precise medical terminology with clinical reasoning detail
- Include ICD-10 codes where relevant
- Present differentials with supporting evidence and distinguishing features
- Structured format: HPI -> Review of Systems -> Red Flag Assessment -> Differential Dx (ranked with rationale) -> Triage -> Management
- No need to explain basic medical concepts
- Assume the user is a healthcare professional or has medical training
""",
}

IMAGE_ANALYSIS_PROMPT = CLINICAL_FRAMEWORK + """

You are analyzing a medical image uploaded by the user.

INSTRUCTIONS:
1. Start with a brief disclaimer
2. Describe what you observe in the image systematically
3. Correlate findings with the user's described symptoms
4. Apply the red flag screening from the framework above
5. Provide a triage recommendation

RESPONSE FORMAT:
- Sections: disclaimer -> image observation summary -> red flag check -> analysis and correlation -> triage
- After your analysis, include a structured findings block at the end of your response in this exact format:

<findings>
[
  {"id": "f1", "label": "Finding name", "confidence": 87, "color": "orange", "x": 0.1, "y": 0.2, "w": 0.3, "h": 0.4}
]
</findings>

Each finding must have: id (f1, f2, ...), label (short description), confidence (0-100), color ("orange"/"blue"/"green"), and bounding box (x, y, w, h as 0-1 normalized ratios). Include 0 findings if nothing abnormal is detected."""

GUARDRAIL = "\n\nCRITICAL RESTRICTION: You are strictly limited to medical and health-related topics. If a user asks about non-medical subjects (such as entertainment, politics, sports, coding, general knowledge, or any topic outside healthcare), politely decline by saying \"I'm sorry, but I can only assist with medical and health-related questions. Please ask me about your symptoms, medical concerns, or health questions.\" and redirect back to medical topics."

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
        return IMAGE_ANALYSIS_PROMPT + GUARDRAIL
    return FULL_MODE_PROMPTS.get(mode, FULL_MODE_PROMPTS["standard"]) + GUARDRAIL


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
        client = get_http_client(timeout=15.0)
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


