# API Contracts & Automated QA Test Hooks

All HTTP endpoints are exposed through the Nginx reverse proxy on port 5173 (`http://localhost:5173/api/`) and directly via the FastAPI backend on port 8000 (`http://localhost:8000/api/`).

---

## 1. Endpoints

### `GET /api/health`
Health check endpoint used by uptime monitors and orchestration.

- **Response `200 OK`:**
  ```json
  {"status": "ok"}
  ```

---

### `POST /api/analyze`
Processes an uploaded support export CSV and returns the complete triage report.

- **Query Parameters:**
  - `now` (optional, string): Reference ISO-8601 UTC timestamp.
  - `stream` (optional, boolean): If `true`, enables Server-Sent Events (SSE) streaming.
- **Request Body:** `multipart/form-data` with form field `file=@export.csv`.

#### Synchronous Mode (`stream=false`)
- **Response `200 OK` (`application/json`):**
  ```json
  {
    "total_unique_messages": 597,
    "category_counts": { "delivery": 183, "payment": 98, "...": 0 },
    "urgent_message_ids": ["M05b1b477", "..."],
    "messages": [
      {
        "message_id": "M2c2e5e10",
        "category": "delivery",
        "is_urgent": false,
        "order_ref": "BZ-932252",
        "duplicate_of": null,
        "customer_id": "C72566",
        "channel": "email",
        "received_at": "2026-08-22T08:58:00Z",
        "answered_at": "2026-08-22T09:09:00Z",
        "subject": "تحویل در روز تعطیل",
        "body": "...",
        "severity": "low",
        "severity_hint": "low",
        "sla_deadline_at": "2026-08-22T10:58:00Z"
      }
    ]
  }

  ```

#### Streaming Mode (`stream=true`)
- **Response `200 OK` (`text/event-stream`):**
  Emits incremental progress events:
  ```text
  data: {"step": "ingest", "progress": 10, "message": "بارگذاری و اعتبارسنجی ساختار فایل اکسپورت..."}

  data: {"step": "dedup", "progress": 25, "message": "استخراج شناسه سفارش و پالایش پیام‌های تکراری..."}

  data: {"step": "classify", "progress": 38, "message": "دسته‌بندی پیام‌ها: بسته 2 از 6 تکمیل شد (38٪)..."}

  data: {"step": "sla", "progress": 90, "message": "محاسبه قوانین ساعات کاری ایران و اولویت‌بندی تعهد SLA..."}

  data: {"step": "complete", "progress": 100, "message": "تحلیل با موفقیت انجام شد.", "result": { ... full report ... }}
  ```

---

### `POST /api/draft`
Generates an AI-assisted customer reply draft with safety guardrail enforcement.

- **Request Body (`application/json`):**
  ```json
  {
    "message_id": "M1a2b3c4d",
    "customer_id": "C123",
    "subject": "کالای شکسته",
    "body": "بسته رسید ولی لیوان داخل آن شکسته بود"
  }
  ```
- **Response `200 OK` (`application/json`):**
  ```json
  {
    "message_id": "M1a2b3c4d",
    "draft": "سلام، از مشکلی که برای سفارش شما پیش آمده عذرخواهی می‌کنیم...",
    "language": "fa",
    "blocked": false,
    "warnings": []
  }
  ```
- **Response if Unsafe or LLM Unavailable (`200 OK`):**
  ```json
  {
    "message_id": "M1a2b3c4d",
    "draft": "",
    "language": "fa",
    "blocked": true,
    "warnings": ["پاسخ تولید شده شامل وعده مالی یا تاریخی نامعتبر بود."]
  }
  ```

---

## 2. Automated QA Testing Hooks (`data-testid`)

The frontend exposes dedicated DOM hooks used by end-to-end smoke tests and QA clock-freeze harnesses:

| `data-testid` | Element Target | Notes |
|---|---|---|
| `upload-input` | `<input type="file">` | CSV file selection input. |
| `analyze-button` | `<button type="submit">` | Triggers file upload and analysis. |
| `urgent-count` | Metric element | Contains the exact count of urgent messages where `business_minutes_left <= 0`. |
| `attention-row` | `<li>` in attention list | Rendered in display order; carries `data-message-id` and `data-business-minutes-left`. |
| `draft-button` | `<button>` in row | Initiates on-demand AI draft generation. |
| `draft-text` | `<textarea>` | Editable text area containing the generated draft. |
| `draft-approve` | `<button>` | Approves and copies draft to clipboard. |
| `draft-warning` | `<div>` | Rendered when draft generation is blocked or fails. |
