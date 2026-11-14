"""Backward-compatibility bridge for urgency evaluation (consolidated into sla)."""
from __future__ import annotations

from .sla import is_urgent

__all__ = ["is_urgent"]
