"""Client for an OpenAI-compatible chat-completions endpoint."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

import httpx

from .config import CATEGORIES, Settings

SYSTEM_PROMPT = (
    "You classify customer support messages for Bazarcheh, an Iranian online shop. "
    "Messages may be in Persian, English or Finglish. "
    f"Allowed categories: {', '.join(CATEGORIES)}. "
    "Allowed severities: low, medium, high. "
    'Reply with a JSON array only, for example: [{"message_id": "...", "category": "delivery", "severity": "medium"}]'
)


@dataclass(frozen=True)
class MessageToClassify:
    message_id: str
    subject: str
    body: str


@dataclass(frozen=True)
class Classification:
    category: str
    severity: str | None


class LLMClient:
    def __init__(self, settings: Settings) -> None:
        if not settings.llm_base_url:
            raise ValueError("LLM_BASE_URL is not configured")
        self._url = settings.llm_base_url.rstrip("/") + "/chat/completions"
        self._model = settings.llm_model
        self._headers = {"Content-Type": "application/json"}
        if settings.llm_api_key:
            self._headers["Authorization"] = f"Bearer {settings.llm_api_key}"
        self._timeout = settings.llm_timeout_seconds

    def complete_text(self, prompt: str) -> str:
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": [{"role": "user", "content": prompt}],
        }
        with httpx.Client(timeout=self._timeout) as client:
            response = client.post(self._url, json=payload, headers=self._headers)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    def classify(self, messages: list[MessageToClassify], chunk_size: int = 20) -> dict[str, Classification]:
        """Classify messages in batches to minimize network roundtrips and conserve quota.

        Returns a mapping message_id -> Classification.
        """
        results: dict[str, Classification] = {}
        with httpx.Client(timeout=self._timeout) as client:
            for i in range(0, len(messages), chunk_size):
                chunk = messages[i : i + chunk_size]
                try:
                    payload = {
                        "model": self._model,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {
                                "role": "user",
                                "content": json.dumps(
                                    [
                                        {"message_id": m.message_id, "subject": m.subject, "body": m.body[:250]}
                                        for m in chunk
                                    ],
                                    ensure_ascii=False,
                                ),
                            },
                        ],
                    }
                    response = client.post(self._url, json=payload, headers=self._headers)
                    response.raise_for_status()
                    text = response.json()["choices"][0]["message"]["content"].strip()
                    if text.startswith("```"):
                        text = re.sub(r"^```(?:json)?\s*", "", text)
                        text = re.sub(r"\s*```$", "", text)
                    items = json.loads(text)
                    if isinstance(items, list):
                        for item in items:
                            mid = str(item.get("message_id", "")).strip()
                            cat = str(item.get("category", "")).strip().lower()
                            if cat not in CATEGORIES:
                                cat = "other"
                            sev = item.get("severity")
                            results[mid] = Classification(
                                category=cat,
                                severity=str(sev).lower() if sev else None,
                            )
                except Exception:
                    continue
        return results
