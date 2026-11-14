"""End-to-end analysis pipeline shared by the API and the CLI."""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import queue
import threading
from typing import IO, Any, Iterator

import pandas as pd

from .classify import classify_messages
from .config import Settings, get_settings
from .drafts import prefetch
from .ingest import canonicalize, load_and_canonicalize, load_messages
from .sla import calculate_sla_deadline, is_urgent


def parse_now(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    ts = pd.Timestamp(value)
    if ts.tzinfo is None:
        ts = ts.tz_localize("UTC")
    return ts.tz_convert("UTC").to_pydatetime()


def _iso(value: Any) -> str | None:
    if value is None or pd.isna(value):
        return None
    return pd.Timestamp(value).tz_convert("UTC").strftime("%Y-%m-%dT%H:%M:%SZ")


def enrich(
    df: pd.DataFrame,
    now: datetime,
    settings: Settings,
    progress_callback: Any = None,
) -> pd.DataFrame:
    """Add order_ref, duplicate_of, category, is_urgent and sla_deadline_at columns."""
    if "duplicate_of" not in df.columns or "order_ref" not in df.columns:
        df = canonicalize(df)
    else:
        df = df.copy()

    canonical = df["duplicate_of"].isna()
    categories = classify_messages(df[canonical], settings, progress_callback=progress_callback)
    by_id = dict(zip(df.loc[canonical, "message_id"], categories))
    df["category"] = [
        by_id[dup if dup is not None else mid]
        for mid, dup in zip(df["message_id"], df["duplicate_of"])
    ]

    df["is_urgent"] = [
        bool(is_canonical)
        and is_urgent(hint, received, answered, now, settings.urgent_sla_business_hours)
        for is_canonical, hint, received, answered in zip(
            canonical, df["severity_hint"], df["received_at"], df["answered_at"]
        )
    ]
    df["sla_deadline_at"] = [
        calculate_sla_deadline(recv, settings.urgent_sla_business_hours) if is_canon else None
        for is_canon, recv in zip(canonical, df["received_at"])
    ]
    return df


def build_report(df: pd.DataFrame, include_details: bool = False) -> dict[str, Any]:
    unique = df[df["duplicate_of"].isna()]
    counts = unique["category"].value_counts()

    messages: list[dict[str, Any]] = []
    for row in df.itertuples(index=False):
        item: dict[str, Any] = {
            "message_id": row.message_id,
            "category": row.category,
            "is_urgent": bool(row.is_urgent),
            "order_ref": row.order_ref,
            "duplicate_of": row.duplicate_of,
        }
        if include_details:
            item.update(
                {
                    "customer_id": row.customer_id,
                    "channel": row.channel,
                    "received_at": _iso(row.received_at),
                    "answered_at": _iso(row.answered_at),
                    "subject": row.subject,
                    "body": row.body,
                    "severity": row.severity_hint,
                    "severity_hint": row.severity_hint,
                    "sla_deadline_at": _iso(row.sla_deadline_at),
                }
            )
        messages.append(item)

    return {
        "total_unique_messages": int(len(unique)),
        "category_counts": {str(k): int(v) for k, v in counts.items()},
        "urgent_message_ids": sorted(unique.loc[unique["is_urgent"], "message_id"].tolist()),
        "messages": messages,
    }


def analyze(
    source: str | Path | IO[bytes] | IO[str],
    now: datetime | None = None,
    settings: Settings | None = None,
    include_details: bool = False,
    prefetch_drafts: bool = False,
) -> dict[str, Any]:
    settings = settings or get_settings()
    now = now or datetime.now(timezone.utc)
    report: dict[str, Any] = {}
    for event in analyze_stream(source, now, settings, include_details=include_details):
        if event.get("step") == "complete":
            report = event["result"]
            break
    if prefetch_drafts:
        urgent = set(report["urgent_message_ids"])
        prefetch([m for m in report["messages"] if m["message_id"] in urgent], settings)
    return report


def analyze_stream(
    source: str | Path | IO[bytes] | IO[str],
    now: datetime | None = None,
    settings: Settings | None = None,
    include_details: bool = True,
) -> Iterator[dict[str, Any]]:
    settings = settings or get_settings()
    now = now or datetime.now(timezone.utc)

    yield {
        "step": "ingest",
        "progress": 10,
        "message": "بارگذاری و اعتبارسنجی ساختار فایل اکسپورت...",
    }
    df = load_messages(source)

    yield {
        "step": "dedup",
        "progress": 25,
        "message": "استخراج شناسه سفارش و پالایش پیام‌های تکراری...",
    }
    df = canonicalize(df)

    canonical = df["duplicate_of"].isna()
    canonical_count = int(canonical.sum())

    yield {
        "step": "classify",
        "progress": 30,
        "message": f"آغاز دسته‌بندی هوشمند {canonical_count} پیام یکتا...",
    }

    q: queue.Queue[dict[str, Any] | None] = queue.Queue()
    categories_holder: list[pd.Series] = []
    error_holder: list[Exception] = []

    def progress_callback(done: int, total: int) -> None:
        pct = 30 + int((done / total) * 55)
        q.put({
            "step": "classify",
            "progress": pct,
            "message": f"دسته‌بندی پیام‌ها: بسته {done} از {total} تکمیل شد ({pct}٪)...",
        })

    def run_classify() -> None:
        try:
            cats = classify_messages(df[canonical], settings, progress_callback=progress_callback)
            categories_holder.append(cats)
        except Exception as e:
            error_holder.append(e)
        finally:
            q.put(None)

    th = threading.Thread(target=run_classify, daemon=True)
    th.start()

    while True:
        event = q.get()
        if event is None:
            break
        yield event

    th.join()
    if error_holder:
        raise error_holder[0]

    categories = categories_holder[0]
    by_id = dict(zip(df.loc[canonical, "message_id"], categories))
    df["category"] = [
        by_id[dup if dup is not None else mid]
        for mid, dup in zip(df["message_id"], df["duplicate_of"])
    ]

    yield {
        "step": "sla",
        "progress": 90,
        "message": "محاسبه قوانین ساعات کاری ایران و اولویت‌بندی تعهد SLA...",
    }

    df["is_urgent"] = [
        bool(is_canonical)
        and is_urgent(hint, received, answered, now, settings.urgent_sla_business_hours)
        for is_canonical, hint, received, answered in zip(
            canonical, df["severity_hint"], df["received_at"], df["answered_at"]
        )
    ]
    df["sla_deadline_at"] = [
        calculate_sla_deadline(recv, settings.urgent_sla_business_hours) if is_canon else None
        for is_canon, recv in zip(canonical, df["received_at"])
    ]

    report = build_report(df, include_details=include_details)

    yield {
        "step": "complete",
        "progress": 100,
        "message": "تحلیل با موفقیت انجام شد.",
        "result": report,
    }
