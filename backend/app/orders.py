"""Order reference extraction."""
from __future__ import annotations

import re

_DIGIT_MAP = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
ORDER_REF_PATTERN = re.compile(r"BZ-([0-9]+)", re.IGNORECASE)


def normalize_digits(text: str) -> str:
    """Normalize Persian and Arabic digits to ASCII digits."""
    return text.translate(_DIGIT_MAP)


def find_order_ref(text: str | None) -> str | None:
    """Return the first ``BZ-<digits>`` reference in ``text`` (upper-cased prefix and ASCII digits)."""
    if not text:
        return None
    normalized = normalize_digits(text)
    match = ORDER_REF_PATTERN.search(normalized)
    if match is None:
        return None
    return f"BZ-{match.group(1)}"


def extract_order_ref(order_ref: str | None, body: str | None) -> str | None:
    """Prefer the explicit ``order_ref`` field; fall back to scanning the body."""
    return find_order_ref(order_ref) or find_order_ref(body)
