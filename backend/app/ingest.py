"""Loading the support-system CSV export into a DataFrame."""
from __future__ import annotations

from pathlib import Path
from typing import IO

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


def parse_timestamps(values: pd.Series) -> pd.Series:
    """Parse export timestamps (ISO-8601, UTC) into tz-aware UTC values."""
    return pd.to_datetime(values, errors="coerce", utc=True, format="ISO8601")


def load_messages(source: str | Path | IO[bytes] | IO[str]) -> pd.DataFrame:
    """Read a support export and return one row per message, in file order."""
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

    # discard malformed rows
    df = df.dropna(subset=["received_at"])

    return df.reset_index(drop=True)
