from __future__ import annotations

from app.drafts import detect_language, validate_safety, generate
from app.config import Settings


def test_detect_language() -> None:
    assert detect_language("سلام، بسته من هنوز نرسیده است") == "fa"
    assert detect_language("پیگیری سفارش BZ-12345") == "fa"
    assert detect_language("Hello, where is my package?") == "en"
    assert detect_language("My order BZ-999 was delayed") == "en"


def test_safety_validator_blocks_money_and_dates() -> None:
    safe_text = "سلام، پیام شما دریافت شد و تیم پشتیبانی در حال بررسی موضوع است."
    is_safe, warnings = validate_safety(safe_text)
    assert is_safe is True
    assert warnings == []

    # Unsafe: promises refund / money
    unsafe_refund = "ما مبلغ ۵۰ هزار تومان را به حساب شما برگشت می‌دهیم."
    is_safe, warnings = validate_safety(unsafe_refund)
    assert is_safe is False
    assert len(warnings) > 0

    # Unsafe: promises dates / deadlines
    unsafe_date = "سفارش شما تا فردا تحویل داده خواهد شد."
    is_safe, warnings = validate_safety(unsafe_date)
    assert is_safe is False
    assert len(warnings) > 0

    # Unsafe: English money and date promises
    unsafe_en = "We will refund $50 to your card within 2 days."
    is_safe, warnings = validate_safety(unsafe_en)
    assert is_safe is False
    assert len(warnings) > 0


def test_generate_llm_unavailable_returns_blocked() -> None:
    dummy_settings = Settings(
        urgent_sla_business_hours=2.0,
        llm_base_url=None,
        llm_api_key=None,
        llm_model="gpt-4o-mini",
        llm_timeout_seconds=5.0,
    )
    result = generate("msg-1", "مشکل پرداخت", "پول کسر شد ولی سفارش ثبت نشد", settings=dummy_settings)
    assert result["message_id"] == "msg-1"
    assert result["blocked"] is True
    assert result["draft"] == ""
    assert result["language"] == "fa"
    assert len(result["warnings"]) > 0
