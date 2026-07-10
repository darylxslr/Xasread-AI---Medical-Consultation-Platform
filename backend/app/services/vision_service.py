import json
import re
from .client import get_http_client

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1/models"


def parse_mime_type(base64_data: str) -> str:
    if base64_data.startswith("data:"):
        return base64_data.split(";")[0].split(":")[1]
    return "image/png"


def strip_data_url(base64_data: str) -> str:
    if "," in base64_data:
        return base64_data.split(",", 1)[1]
    return base64_data


async def gemini_analyze_image(
    gemini_key: str,
    base64_data: str,
    prompt: str,
) -> tuple[str | None, list[dict]]:
    mime_type = parse_mime_type(base64_data)
    raw_data = strip_data_url(base64_data)

    url = f"{GEMINI_BASE}/gemini-2.5-flash:generateContent?key={gemini_key}"

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": mime_type, "data": raw_data}},
            ]
        }]
    }

    try:
        client = get_http_client(timeout=15.0)
        resp = await client.post(url, json=payload)
        if resp.status_code != 200:
            return None, []
        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return None, []
        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            return None, []
        text = parts[0].get("text", "")
    except Exception:
        return None, []

    match = re.search(r"<findings>\s*(.*?)\s*</findings>", text, re.DOTALL)
    if match:
        try:
            findings_data = json.loads(match.group(1))
            if not isinstance(findings_data, list):
                findings_data = []
        except (json.JSONDecodeError, TypeError):
            findings_data = []
    else:
        findings_data = []

    clean = re.sub(r"\s*<findings>.*?</findings>\s*", "", text, flags=re.DOTALL).strip()
    return clean, findings_data


