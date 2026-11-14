from __future__ import annotations

from datetime import datetime, timezone, timedelta

from app.sla import (
    business_hours_between,
    business_minutes_left,
    calculate_sla_deadline,
    is_urgent,
    TEHRAN_TZ,
)


def _utc(*args: int) -> datetime:
    return datetime(*args, tzinfo=timezone.utc)


def _tehran(year: int, month: int, day: int, hour: int, minute: int) -> datetime:
    return datetime(year, month, day, hour, minute, tzinfo=TEHRAN_TZ)


def test_business_hours_within_one_day() -> None:
    # Saturday 2026-10-24 (1405/08/02), 10:00 -> 13:30 Tehran time = 3.5 hours
    start = _tehran(2026, 10, 24, 10, 0)
    end = _tehran(2026, 10, 24, 13, 30)
    assert business_hours_between(start, end) == 3.5


def test_business_hours_outside_work_window() -> None:
    # Night hours before 09:00 and after 17:00 do not count
    start = _tehran(2026, 10, 24, 6, 0)
    end = _tehran(2026, 10, 24, 9, 30)
    assert business_hours_between(start, end) == 0.5

    start2 = _tehran(2026, 10, 24, 16, 30)
    end2 = _tehran(2026, 10, 24, 20, 0)
    assert business_hours_between(start2, end2) == 0.5


def test_business_hours_skip_iranian_weekend() -> None:
    # Wednesday 16:00 Tehran -> Saturday 10:00 Tehran:
    # Wednesday 16:00-17:00 (1h)
    # Thursday (weekend): 0h
    # Friday (weekend): 0h
    # Saturday 09:00-10:00 (1h)
    # Total = 2.0 hours
    start = _tehran(2026, 10, 21, 16, 0)  # Wednesday
    end = _tehran(2026, 10, 24, 10, 0)    # Saturday
    assert business_hours_between(start, end) == 2.0


def test_business_hours_skip_official_1405_holidays() -> None:
    # 1405/01/12 is 2026-04-01 (Wednesday) - official holiday.
    # Tuesday 2026-03-31 16:00 Tehran -> Saturday 2026-04-04 10:00 Tehran:
    # Tuesday 16:00-17:00 (1h)
    # Wednesday 2026-04-01 (1405/01/12 holiday): 0h
    # Thursday 2026-04-02 (weekend + 1405/01/13 holiday): 0h
    # Friday 2026-04-03 (weekend): 0h
    # Saturday 2026-04-04 09:00-10:00 (1h)
    # Total = 2.0 hours
    start = _tehran(2026, 3, 31, 16, 0)
    end = _tehran(2026, 4, 4, 10, 0)
    assert business_hours_between(start, end) == 2.0


def test_business_hours_utc_conversion() -> None:
    # 09:00 Tehran is 05:30 UTC
    # 17:00 Tehran is 13:30 UTC
    # Saturday 2026-10-24 05:30 UTC -> 13:30 UTC = full 8 business hours
    start = _utc(2026, 10, 24, 5, 30)
    end = _utc(2026, 10, 24, 13, 30)
    assert business_hours_between(start, end) == 8.0


def test_business_minutes_left() -> None:
    # 2 hours SLA
    # Received at 10:00 Tehran, now is 11:30 Tehran on the same day -> 30 mins left
    received = _tehran(2026, 10, 24, 10, 0)
    now = _tehran(2026, 10, 24, 11, 30)
    assert business_minutes_left(received, now, sla_hours=2.0) == 30

    # Exactly 2 hours -> 0 mins left (urgent!)
    now_exact = _tehran(2026, 10, 24, 12, 0)
    assert business_minutes_left(received, now_exact, sla_hours=2.0) == 0

    # 2.5 hours -> overdue by 30 mins (-30)
    now_overdue = _tehran(2026, 10, 24, 12, 30)
    assert business_minutes_left(received, now_overdue, sla_hours=2.0) == -30


def test_calculate_sla_deadline_same_day() -> None:
    # Received at 10:00 Saturday, 2 hours SLA -> deadline at 12:00 Saturday
    received = _tehran(2026, 10, 24, 10, 0)
    deadline = calculate_sla_deadline(received, sla_hours=2.0)
    assert deadline == _tehran(2026, 10, 24, 12, 0)
    assert business_hours_between(received, deadline) == 2.0


def test_calculate_sla_deadline_across_weekend() -> None:
    # Received Wednesday 16:00 (1h before 17:00 close), 2h SLA -> deadline Saturday 10:00
    received = _tehran(2026, 10, 21, 16, 0)
    deadline = calculate_sla_deadline(received, sla_hours=2.0)
    assert deadline == _tehran(2026, 10, 24, 10, 0)
    assert business_hours_between(received, deadline) == 2.0


def test_is_urgent() -> None:
    received = _tehran(2026, 10, 24, 10, 0)
    now_before = _tehran(2026, 10, 24, 11, 30)
    now_urgent = _tehran(2026, 10, 24, 12, 30)

    # Low severity is never urgent
    assert not is_urgent("low", received, None, now_urgent, 2.0)

    # High severity unanswered past SLA is urgent
    assert is_urgent("high", received, None, now_urgent, 2.0)
    assert not is_urgent("high", received, None, now_before, 2.0)

    # Already answered is not urgent
    answered = _tehran(2026, 10, 24, 11, 0)
    assert not is_urgent("high", received, answered, now_urgent, 2.0)

