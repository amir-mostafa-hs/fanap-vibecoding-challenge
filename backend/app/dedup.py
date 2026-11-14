"""Backward-compatibility bridge for deduplication (consolidated into ingest)."""
from __future__ import annotations

from .ingest import (
    dedup_key,
    mark_duplicates,
    normalize_body,
)

__all__ = [
    "dedup_key",
    "mark_duplicates",
    "normalize_body",
]
