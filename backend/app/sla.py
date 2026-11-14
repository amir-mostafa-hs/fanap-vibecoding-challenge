"""Business-hours arithmetic for the support SLA.

Support hours: Saturday to Wednesday, 09:00–17:00 Tehran time (UTC+03:30).
Thursday and Friday are weekends, plus official public holidays for year 1405.
"""
from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone

TEHRAN_TZ = timezone(timedelta(hours=3, minutes=30), name="Asia/Tehran")

BUSINESS_START = time(9, 0)
BUSINESS_END = time(17, 0)

# Iranian business schedule (Saturday through Wednesday):
BUSINESS_WEEKDAYS = frozenset({5, 6, 0, 1, 2})

# Official 1405 public holidays mapped to Gregorian dates (YYYY-MM-DD):
# 1405/01/01 -> 2026-03-21
# 1405/01/02 -> 2026-03-22
# 1405/01/03 -> 2026-03-23
# 1405/01/04 -> 2026-03-24
# 1405/01/12 -> 2026-04-01
# 1405/01/13 -> 2026-04-02
# 1405/01/25 -> 2026-04-14
# 1405/03/07 -> 2026-05-28
# 1405/03/14 -> 2026-06-04
# 1405/03/15 -> 2026-06-05
# 1405/04/05 -> 2026-06-26
# 1405/04/06 -> 2026-06-27
# 1405/05/15 -> 2026-08-06
# 1405/05/23 -> 2026-08-14
# 1405/05/25 -> 2026-08-16
# 1405/06/01 -> 2026-08-23
# 1405/06/10 -> 2026-09-01
# 1405/08/24 -> 2026-11-15
# 1405/10/03 -> 2026-12-24
# 1405/10/17 -> 2027-01-07
# 1405/11/05 -> 2027-01-25
# 1405/11/22 -> 2027-02-11
# 1405/12/10 -> 2027-03-01
# 1405/12/20 -> 2027-03-11
# 1405/12/21 -> 2027-03-12
# 1405/12/29 -> 2027-03-20
HOLIDAYS_1405: frozenset[date] = frozenset({
    date(2026, 3, 21),
    date(2026, 3, 22),
    date(2026, 3, 23),
    date(2026, 3, 24),
    date(2026, 4, 1),
    date(2026, 4, 2),
    date(2026, 4, 14),
    date(2026, 5, 28),
    date(2026, 6, 4),
    date(2026, 6, 5),
    date(2026, 6, 26),
    date(2026, 6, 27),
    date(2026, 8, 6),
    date(2026, 8, 14),
    date(2026, 8, 16),
    date(2026, 8, 23),
    date(2026, 9, 1),
    date(2026, 11, 15),
    date(2026, 12, 24),
    date(2027, 1, 7),
    date(2027, 1, 25),
    date(2027, 2, 11),
    date(2027, 3, 1),
    date(2027, 3, 11),
    date(2027, 3, 12),
    date(2027, 3, 20),
})


def is_business_day(d: date) -> bool:
    """Return True if ``d`` is Saturday–Wednesday and not an official holiday."""
    return d.weekday() in BUSINESS_WEEKDAYS and d not in HOLIDAYS_1405


def to_tehran(dt: datetime) -> datetime:
    """Ensure datetime is tz-aware and converted to Tehran timezone."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(TEHRAN_TZ)


def business_hours_between(start: datetime, end: datetime) -> float:
    """Number of business hours in the interval ``[start, end)`` in Tehran time.

    Nights, Thursdays, Fridays and official holidays are excluded.
    """
    if end <= start:
        return 0.0

    start_local = to_tehran(start)
    end_local = to_tehran(end)

    total_seconds = 0.0
    current_date = start_local.date()
    end_date = end_local.date()

    while current_date <= end_date:
        if is_business_day(current_date):
            work_open = datetime.combine(current_date, BUSINESS_START, tzinfo=TEHRAN_TZ)
            work_close = datetime.combine(current_date, BUSINESS_END, tzinfo=TEHRAN_TZ)
            interval_start = max(work_open, start_local)
            interval_end = min(work_close, end_local)
            if interval_end > interval_start:
                total_seconds += (interval_end - interval_start).total_seconds()
        current_date += timedelta(days=1)

    return total_seconds / 3600.0


def business_minutes_left(
    received_at: datetime,
    now: datetime,
    sla_hours: float = 2.0,
) -> int:
    """Integer business minutes until the SLA is broken (0 or negative = overdue)."""
    elapsed_hours = business_hours_between(received_at, now)
    minutes_left = (sla_hours - elapsed_hours) * 60.0
    return round(minutes_left)
