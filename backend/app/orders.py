"""Backward-compatibility bridge for order extraction (consolidated into ingest)."""
from __future__ import annotations

from .ingest import (
    ORDER_REF_PATTERN,
    extract_order_ref,
    find_order_ref,
    normalize_digits,
)

__all__ = [
    "ORDER_REF_PATTERN",
    "extract_order_ref",
    "find_order_ref",
    "normalize_digits",
]
