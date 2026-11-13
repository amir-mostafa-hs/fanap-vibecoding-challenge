"""Business-hours arithmetic for the support SLA."""
from __future__ import annotations

from datetime import datetime, time, timedelta, timezone

BUSINESS_START = time(9, 0)
BUSINESS_END = time(17, 0)
BUSINESS_WEEKDAYS = frozenset({0, 1, 2, 3, 4})


def is_business_day(day: datetime) -> bool:
    return day.weekday() in BUSINESS_WEEKDAYS


def business_hours_between(start: datetime, end: datetime) -> float:
    """Number of business hours in the half-open interval ``[start, end)``."""
    if end <= start:
        return 0.0

    # All timestamps are normalized to local time upstream
    start = start.astimezone(timezone.utc)
    end = end.astimezone(timezone.utc)

    total = timedelta(0)
    day = datetime.combine(start.date(), time(0, 0), tzinfo=timezone.utc)
    while day <= end:
        if is_business_day(day):
            opens = datetime.combine(day.date(), BUSINESS_START, tzinfo=timezone.utc)
            closes = datetime.combine(day.date(), BUSINESS_END, tzinfo=timezone.utc)
            lo = max(opens, start)
            hi = min(closes, end)
            if hi > lo:
                total += hi - lo
        day += timedelta(days=1)

    return total.total_seconds() / 3600.0
