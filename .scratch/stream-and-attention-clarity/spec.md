# Spec: Attention List Clarity & Live Analysis Progress Streaming

## Problem Statement

When users and support team members (like Sara) upload a daily export to the support dashboard:
1. **Metric Discrepancy & Visual Ambiguity:** The summary tile reports "Urgent: 30", while the "Needs Attention" list heading shows 51 messages. While mathematically and logically consistent according to the SLA (30 have breached the 2-hour SLA, and 21 are approaching breach), the user interface provides no clear categorization, filtering, or badge differentiation to explain why there are 51 items when only 30 are urgent.
2. **Lack of Progress Transparency:** Uploading and analyzing a daily support export takes ~35 seconds due to AI categorization and SLA processing. During this entire wait time, the user is presented only with a disabled button reading "در حال تحلیل...", with no indication of system status, batch completion, or current stage.

## Solution

1. **Attention List & Metrics Clarity:**
   - Enhance the summary cards to clearly breakdown: Unique Messages, Overdue / Urgent (breached SLA), Approaching Deadline (within SLA window), and Total Attention Queue.
   - Introduce interactive filter tabs in the Attention List: "همه (۵۱)", "فوری و معوق (۳۰)", "در مهلت تعهد (۲۱)".
   - Apply distinctive visual badges to attention rows (red for overdue, amber for approaching deadline) while keeping existing automated QA test contracts intact (`data-testid="urgent-count"`, `data-testid="attention-row"`, `data-business-minutes-left`).
2. **Live Analysis Progress Streaming:**
   - Implement Server-Sent Events (SSE) streaming on `/api/analyze?stream=true` that yields real-time progress events across 5 distinct pipeline stages:
     1. Ingestion & Validation
     2. Deduplication & Order Ref Extraction
     3. Batch LLM Classification (progressing incrementally per completed worker batch)
     4. SLA Calendar Calculation
     5. Report Finalization & Delivery
   - Provide an interactive, animated progress widget in the upload form displaying percentage and active/completed stage indicators.
   - Maintain 100% backward-compatibility for non-streaming requests (`stream=false`).

## User Stories

1. As a support lead (Sara), I want to see a clear breakdown of why 30 messages are urgent while 51 need attention, so that I understand which customer issues have already breached the 2-hour SLA and which are about to breach.
2. As a support agent, I want filter tabs on the Needs Attention list, so that I can focus exclusively on overdue urgent tickets first before moving to near-deadline messages.
3. As a support agent, I want distinct visual badges on each attention row, so that I can immediately distinguish an SLA-breached message from an approaching-deadline message.
4. As a dashboard user, I want to see live progress and current stage information when I click "تحلیل فایل", so that I know the system is actively working rather than hanging or frozen.
5. As a dashboard user, I want to see an incremental percentage bar and active task description (e.g. "در حال دسته‌بندی هوشمند: بسته ۳ از ۶"), so that I can estimate when the analysis will complete.
6. As a QA automated tester, I want the dashboard to maintain `data-testid="urgent-count"` with the exact count of overdue messages, so that automated smoke tests continue to pass.
7. As a QA automated tester, I want the attention rows to retain `data-testid="attention-row"`, `data-message-id`, and `data-business-minutes-left`, so that clock-freeze test suites remain green.
8. As a backend API consumer (like the nightly CLI), I want `POST /api/analyze` without `stream=true` to continue returning plain JSON, so that existing integrations do not break.

## Implementation Decisions

- **Streaming Transport via SSE (`text/event-stream`):**
  Use Server-Sent Events over HTTP POST (`/api/analyze?stream=true`) using FastAPI's `StreamingResponse`. Each event emits a JSON payload: `{"step": str, "progress": int, "message": str, "result": dict | None}`.
- **Progress Tracking Seams in Backend:**
  Add a progress callback to `LLMClient.classify` and `classify_messages` that fires upon completion of each worker batch in `concurrent.futures.as_completed`.
- **Nginx Buffering Configuration:**
  Set `proxy_buffering off;` and send `X-Accel-Buffering: no` headers so progress chunks stream directly to the browser without being buffered.
- **Frontend Stream Consumption:**
  Use `ReadableStreamDefaultReader` in the frontend API client to parse incoming SSE lines and update React state in real time.
- **Preservation of Automated QA Attributes:**
  `data-testid="urgent-count"` must continue to contain the count of messages where `business_minutes_left <= 0`.
  `data-testid="attention-row"` must render for attention messages with accurate `data-business-minutes-left`.

## Testing Decisions

- **External Behavior Testing:** Tests must verify external behavior (HTTP response types, SSE message formats, UI filter states, badge classes, and tile counts) rather than internal state.
- **Backend Tests:** Test both regular JSON `/api/analyze` and streaming SSE `/api/analyze?stream=true`.
- **Frontend Tests:** Test `SummaryTiles`, `AttentionList` tab filtering, and `UploadForm` progress bar rendering.

## Out of Scope

- Changing the underlying 2.0-hour business SLA definition or Iranian holiday calendar.
- Implementing automatic background polling while an analysis is in progress.
- Replacing the CLI JSON output format.

## Further Notes

- Iranian support working hours (09:00 to 17:00 Saturday through Wednesday) and the 26 official 1405 public holidays remain the gold-standard reference for SLA calculation.
