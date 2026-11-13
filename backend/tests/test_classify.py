from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from app.classify import classify_keywords, classify_messages
from app.config import Settings
from app.llm import LLMClient, MessageToClassify


def test_classify_keywords_fallback() -> None:
    assert classify_keywords("مشکل بسته", "بسته من ارسال نشده") == "delivery"
    assert classify_keywords("برگشت پول", "مبلغ کسر شده بازگشت داده نشده") == "refund"
    assert classify_keywords("رمز عبور", "نمیتوانم لاگین کنم") == "account"
    assert classify_keywords("سلام", "احوالپرسی") == "other"


def test_llm_classify_concurrent_batches() -> None:
    settings = Settings(
        urgent_sla_business_hours=2.0,
        llm_base_url="https://api.mock.example/v1",
        llm_api_key="mock-key",
        llm_model="mock-model",
        llm_timeout_seconds=30.0,
    )
    client = LLMClient(settings)

    # 40 messages = 2 chunks of 20
    msgs = [
        MessageToClassify(message_id=f"M{i}", subject=f"Subj {i}", body=f"Body {i}")
        for i in range(40)
    ]

    def mock_post(url: str, json: dict, headers: dict) -> MagicMock:
        # Extract requested messages from user payload
        user_content = json["messages"][1]["content"]
        items = import_json = __import__("json").loads(user_content)
        mock_resp = MagicMock()
        mock_resp.raise_for_status.return_value = None
        resp_data = [
            {"message_id": item["message_id"], "category": "delivery", "severity": "high"}
            for item in items
        ]
        mock_resp.json.return_value = {
            "choices": [{"message": {"content": __import__("json").dumps(resp_data)}}]
        }
        return mock_resp

    with patch("httpx.Client.post", side_effect=mock_post):
        results = client.classify(msgs, chunk_size=20, max_workers=2)

    assert len(results) == 40
    for i in range(40):
        assert f"M{i}" in results
        assert results[f"M{i}"].category == "delivery"
        assert results[f"M{i}"].severity == "high"
