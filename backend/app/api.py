"""HTTP API used by the dashboard frontend."""
from __future__ import annotations

import io
import json
from typing import Any

from pydantic import BaseModel
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .analysis import analyze, analyze_stream, parse_now
from .drafts import generate

app = FastAPI(title="Bazarcheh Support Triage", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze_upload(
    file: UploadFile = File(...),
    now: str | None = Query(default=None, description="ISO-8601 UTC timestamp"),
    stream: bool = Query(default=False, description="Stream real-time progress via Server-Sent Events"),
) -> Any:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="uploaded file is empty")
    try:
        reference_time = parse_now(now)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"invalid 'now': {exc}") from exc

    if stream:
        def event_generator():
            try:
                for event in analyze_stream(
                    io.BytesIO(content), now=reference_time, include_details=True
                ):
                    yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            except Exception as e:
                err_event = {
                    "step": "error",
                    "progress": 0,
                    "message": f"خطا در تحلیل: {e}",
                    "error": str(e),
                }
                yield f"data: {json.dumps(err_event, ensure_ascii=False)}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    try:
        return analyze(io.BytesIO(content), now=reference_time, include_details=True, prefetch_drafts=False)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


class DraftRequest(BaseModel):
    message_id: str
    customer_id: str | None = None
    subject: str = ""
    body: str = ""


@app.post("/api/draft")
def draft_reply(req: DraftRequest) -> dict[str, Any]:
    return generate(req.message_id, req.subject, req.body)
