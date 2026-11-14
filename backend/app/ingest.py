"""Unified message intake: loading, digit normalization, order parsing, and deduplication."""
from __future__ import annotations

from pathlib import Path
import re
from typing import IO
import unicodedata

import pandas as pd

COLUMNS: list[str] = [
    "message_id",
    "customer_id",
    "channel",
    "received_at",
    "answered_at",
    "subject",
    "body",
    "order_ref",
    "severity_hint",
]

_WHITESPACE = re.compile(r"\s+")
_DIGIT_MAP = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
ORDER_REF_PATTERN = re.compile(r"BZ-([0-9]+)", re.IGNORECASE)


def normalize_digits(text: str) -> str:
    """Normalize Persian and Arabic digits to ASCII digits."""
    return text.translate(_DIGIT_MAP)


def find_order_ref(text: str | None) -> str | None:
    """Return the first ``BZ-<digits>`` reference in ``text``."""
    if not text:
        return None
    normalized = normalize_digits(text)
    match = ORDER_REF_PATTERN.search(normalized)
    if match is None:
        return None
    return f"BZ-{match.group(1)}"


def extract_order_ref(order_ref: str | None, body: str | None) -> str | None:
    """Prefer explicit order_ref; fall back to scanning message body."""
    return find_order_ref(order_ref) or find_order_ref(body)


def normalize_body(text: str) -> str:
    """Canonical form of message body with Unicode NFC and collapsed whitespace."""
    text = unicodedata.normalize("NFC", text or "")
    text = _WHITESPACE.sub(" ", text)
    return text.strip().lower()


def dedup_key(customer_id: str, body: str) -> str:
    return f"{(customer_id or '').strip()}|{normalize_body(body)}"


def mark_duplicates(df: pd.DataFrame) -> pd.Series:
    """Return a Series with canonical message_id for duplicates, None for canonical."""
    keys = [dedup_key(c, b) for c, b in zip(df["customer_id"], df["body"])]
    order = df.assign(_key=keys, _pos=range(len(df))).sort_values(
        ["received_at", "_pos"], kind="stable"
    )

    canonical_for_key: dict[str, str] = {}
    duplicate_of: dict[int, str | None] = {}
    for idx, key, message_id in zip(order.index, order["_key"], order["message_id"]):
        if key in canonical_for_key:
            duplicate_of[idx] = canonical_for_key[key]
        else:
            canonical_for_key[key] = message_id
            duplicate_of[idx] = None

    return pd.Series([duplicate_of[i] for i in df.index], index=df.index, dtype=object)


def parse_timestamps(values: pd.Series) -> pd.Series:
    """Parse export timestamps (ISO-8601, UTC) into tz-aware UTC values."""
    return pd.to_datetime(values, errors="coerce", utc=True, format="ISO8601")


def load_messages(source: str | Path | IO[bytes] | IO[str]) -> pd.DataFrame:
    """Read a support export CSV and validate required columns."""
    df = pd.read_csv(source, dtype=str, keep_default_na=False)

    missing = [c for c in COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"export is missing columns: {', '.join(missing)}")

    df = df[COLUMNS].fillna("")
    for col in ("message_id", "customer_id", "channel", "order_ref", "severity_hint"):
        df[col] = df[col].str.strip()
    df["severity_hint"] = df["severity_hint"].str.lower()

    df = df[df["message_id"] != ""]

    df["received_at"] = parse_timestamps(df["received_at"])
    df["answered_at"] = parse_timestamps(df["answered_at"])

    df = df.dropna(subset=["received_at"])
    return df.reset_index(drop=True)


def canonicalize(df: pd.DataFrame) -> pd.DataFrame:
    """Enrich raw message DataFrame with extracted order_ref and duplicate links."""
    df = df.copy()
    df["order_ref"] = [extract_order_ref(o, b) for o, b in zip(df["order_ref"], df["body"])]
    df["duplicate_of"] = mark_duplicates(df)
    return df


def load_and_canonicalize(source: str | Path | IO[bytes] | IO[str]) -> pd.DataFrame:
    """Single deep entry point: ingest, validate, normalize, and detect duplicates."""
    df = load_messages(source)
    return canonicalize(df)
