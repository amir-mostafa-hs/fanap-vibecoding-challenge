# Backend Architecture & Pipeline

The backend service is built with **FastAPI** and **Python 3.12**, designed for high throughput, safe concurrent AI operations, and resilient fallback handling.

---

## 1. Directory Structure

```text
backend/app/
├── api.py         # HTTP endpoints (REST & SSE streaming)
├── analysis.py    # Pipeline orchestration (synchronous & streaming generators)
├── cli.py         # Nightly batch CLI entry point
├── classify.py    # Category classification logic & keyword fallback rules
├── config.py      # Runtime configuration from environment variables
├── dedup.py       # Duplicate detection & canonical message resolution
├── drafts.py      # Safe AI draft generation & safety regex validation
├── ingest.py      # CSV parsing, column sanitation, and timestamp normalization
├── llm.py         # Thread-safe LLM client with concurrent batch execution
├── orders.py      # Order reference extraction & Eastern-Arabic numeral normalization
├── sla.py         # Iranian business calendar (1405) & business-hours math
└── urgency.py     # Urgency decision rules based on canonical status and SLA breach
```

---

## 2. Key Modules & Algorithms

### Ingestion (`ingest.py`)
- Reads raw CSV bytes or files into Pandas DataFrames.
- Parses timestamps across mixed formats: ISO-8601 UTC strings (`2026-08-22T08:58:00Z`), standard Gregorian dates, and Solar Hijri (Jalali) strings (`1405/05/22 19:37` or `۱۴۰۵/۰۶/۰۲ ۰۸:۵۳`).
- Drops invalid or corrupt records where `received_at` cannot be determined.

### Deduplication (`dedup.py`)
- Detects customer resends: messages sharing the same `customer_id`, normalized `subject`, and normalized `body`.
- Marks repeated messages with `duplicate_of = canonical_message_id`.
- Downstream classification and urgency analysis run exclusively against canonical messages to save AI quota and prevent double-counting.

### Order Extraction (`orders.py`)
- Identifies order references formatted as `BZ-<digits>`.
- Normalizes Eastern-Arabic numerals (`۰-۹` and `٠-٩`) to ASCII (`0-9`) using `str.maketrans`.
- Fallbacks to message body scanning if `order_ref` is blank or invalid.

### Parallel LLM Classifier (`llm.py` & `classify.py`)
- Employs `concurrent.futures.ThreadPoolExecutor(max_workers=6)` to submit message batches (`chunk_size=20`) concurrently.
- Reduces processing time by 75% compared to serial execution, preventing gateway timeouts.
- In case of API failure, automatically falls back to rule-based keyword matching without crashing.

### Live SSE Progress Streaming (`analysis.py` & `api.py`)
- Yields Server-Sent Events over HTTP using a thread-safe `queue.Queue`.
- Reports stage progress incrementally:
  - `10%`: Ingest & validation
  - `25%`: Deduplication & order extraction
  - `30%..85%`: Real-time batch progress emitted as each worker thread finishes
  - `90%`: SLA calculations & urgency resolution
  - `100%`: Final report payload delivery

---

## 3. Safety Guardrails (`drafts.py`)

AI-generated customer reply drafts are subject to strict automated safety verification before reaching the operator:
- **No Money/Refund Promises:** Rejects drafts containing promises of refunds, reimbursements, compensation, or monetary amounts in Persian or English.
- **No Firm Dates/Deadlines:** Rejects drafts pledging delivery by specific dates, weekdays, or timeframes.
- **Language Detection:** Automatically responds in Persian for Persian and Finglish messages, and in English for English inquiries.
- **Fail-Safe Response:** If blocked or if the LLM service is unavailable, returns HTTP 200 with `blocked: true`, `draft: ""`, and descriptive `warnings` to ensure the dashboard remains responsive.
