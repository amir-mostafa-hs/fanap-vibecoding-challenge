"""Draft replies for support messages."""
from __future__ import annotations

from typing import Any

from .config import Settings, get_settings
from .llm import LLMClient

_CACHE: dict[str, dict[str, Any]] = {}


def build_prompt(subject: str, body: str) -> str:
    return (
        "Write a short, friendly reply to this customer message. Be helpful.\n\n"
        f"Subject: {subject}\n"
        f"{body}"
    )


def generate(message_id: str, subject: str, body: str, settings: Settings | None = None) -> dict[str, Any]:
    cached = _CACHE.get(message_id)
    if cached is not None:
        return cached
    settings = settings or get_settings()
    client = LLMClient(settings)
    text = client.complete_text(build_prompt(subject, body))
    result = {
        "message_id": message_id,
        "draft": text.strip(),
        "language": "en",
        "blocked": False,
        "warnings": [],
    }
    _CACHE[message_id] = result
    return result


def prefetch(messages: list[dict[str, Any]], settings: Settings | None = None) -> None:
    """Warm the cache so that drafts are instant when Sara asks for one."""
    settings = settings or get_settings()
    if not settings.llm_base_url:
        return
    for m in messages:
        try:
            generate(m["message_id"], m.get("subject") or "", m.get("body") or "", settings)
        except Exception:
            continue
