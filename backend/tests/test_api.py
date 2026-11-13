from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from app.api import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_upload(sample_csv: Path) -> None:
    with sample_csv.open("rb") as fh:
        response = client.post(
            "/api/analyze",
            params={"now": "2026-10-26T12:00:00Z"},
            files={"file": ("export.csv", fh, "text/csv")},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["total_unique_messages"] == 3
    assert body["messages"][0]["received_at"] == "2026-10-26T08:00:00Z"
