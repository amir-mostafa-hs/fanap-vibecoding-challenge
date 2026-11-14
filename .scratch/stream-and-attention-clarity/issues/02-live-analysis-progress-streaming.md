# 02: Live Analysis Progress Streaming with Server-Sent Events (SSE)

**What to build:** An end-to-end live progress streaming system for file analysis. The backend emits real-time Server-Sent Events (SSE) on `POST /api/analyze?stream=true` across pipeline stages (ingest, dedup, batch LLM classification with per-chunk progress, SLA calculation, and completion). The frontend upload form displays an interactive animated progress bar with stage indicators while processing, and Nginx is configured with `proxy_buffering off` for unbuffered delivery. Non-streaming calls (`stream=false`) remain backward-compatible.

**Blocked by:** 01 (Attention List Clarity, Filter Tabs & Metrics Breakdown)

**Status:** ready-for-agent

- [ ] Add progress tracking and callback hooks in `backend/app/llm.py` and `backend/app/classify.py`.
- [ ] Add generator function in `backend/app/analysis.py` yielding progress events:
  - 10% (Ingest & validation)
  - 25% (Dedup & order extraction)
  - 30%..85% (Concurrent LLM classification progress per completed batch)
  - 90% (SLA calculation)
  - 100% (Complete with full report payload)
- [ ] Support `POST /api/analyze?stream=true` with `StreamingResponse(..., media_type="text/event-stream")` and `X-Accel-Buffering: no` in `backend/app/api.py`.
- [ ] Ensure `POST /api/analyze` without `stream=true` continues to return traditional JSON.
- [ ] Configure `proxy_buffering off;` for `/api/` in `frontend/nginx.conf`.
- [ ] Update frontend client (`api.ts`) to consume SSE via `ReadableStreamDefaultReader`.
- [ ] Add interactive progress UI (percentage bar + stage checklist) in `UploadForm.tsx`.
- [ ] Automated tests in backend (`test_api.py`) and frontend (`UploadForm.test.tsx`).
