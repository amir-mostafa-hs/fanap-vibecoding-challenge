from __future__ import annotations

from datetime import datetime, timezone

from app.sla import business_hours_between


def _utc(*args: int) -> datetime:
    return datetime(*args, tzinfo=timezone.utc)


def test_business_hours_within_one_day() -> None:
    # Monday 2026-10-26, 10:00 -> 13:30
    assert business_hours_between(_utc(2026, 10, 26, 10, 0), _utc(2026, 10, 26, 13, 30)) == 3.5


def test_business_hours_skip_weekend() -> None:
    # Friday 16:00 -> Monday 10:00: one hour on Friday, one on Monday
    start = _utc(2026, 10, 23, 16, 0)
    end = _utc(2026, 10, 26, 10, 0)
    assert business_hours_between(start, end) == 2.0


def test_business_hours_empty_interval() -> None:
    t = _utc(2026, 10, 26, 10, 0)
    assert business_hours_between(t, t) == 0.0
