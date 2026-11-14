from __future__ import annotations

from pathlib import Path

import pandas as pd

from app.ingest import load_messages, load_and_canonicalize


def test_loads_all_clean_rows(sample_csv: Path) -> None:
    df = load_messages(sample_csv)
    assert list(df["message_id"]) == ["M001", "M002", "M003", "M004"]
    assert "does not work" in df.loc[3, "body"]


def test_iso_timestamps_are_utc(sample_csv: Path) -> None:
    df = load_messages(sample_csv)
    assert df.loc[0, "received_at"] == pd.Timestamp("2026-10-26T08:00:00Z")
    assert str(df["received_at"].dt.tz) == "UTC"
    assert pd.isna(df.loc[1, "answered_at"])


def test_load_and_canonicalize(sample_csv: Path) -> None:
    df = load_and_canonicalize(sample_csv)
    assert "order_ref" in df.columns
    assert "duplicate_of" in df.columns
    assert df["duplicate_of"].tolist() == [None, None, "M001", None]
    assert df.loc[0, "order_ref"] == "BZ-10234"

