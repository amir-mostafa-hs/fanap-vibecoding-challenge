# Spec: Bazarcheh Support Triage System

Status: ready-for-agent

## Problem Statement

Sara, who leads customer support at Bazarcheh, is overwhelmed by messages arriving across multiple channels (in-app, web form, email, Telegram, Instagram) in Persian, English, and Finglish. A previous prototype was partially built but abandoned with untrustworthy metrics:
- It fails to observe the Iranian working calendar (Saturday–Wednesday, 09:00–17:00 Asia/Tehran), miscalculates SLA countdowns, and ignores official 1405 holidays.
- It fails to identify order references containing Persian digits.
- It exhausts LLM quotas on CSV uploads via prefetching.
- It lacks safety guardrails for automated reply drafts (promising unauthorized refunds, dates, and amounts, and crashing when the LLM is unavailable).
- The user interface is English and LTR instead of Persian and RTL, and does not dynamically update business SLA urgency without re-uploading the dataset.

## Solution

A robust, Persian-native, RTL support dashboard and backend analysis CLI that:
1. Accurately calculates business hours and urgency against the Iranian solar calendar for year 1405, strictly observing the Saturday–Wednesday 09:00–17:00 work window and official holidays.
2. Extracts order references in both Persian and Latin numerals.
3. Automatically deduplicates repeat messages from the same customer while categorizing issues into the 6 canonical buckets.
4. Provides a live "Needs Attention" list sorted by urgency, updating live in the browser without making server or LLM requests.
5. Generates safe, on-demand AI reply drafts in the customer's language with strict guardrails preventing monetary or schedule commitments.
6. Adheres strictly to the automated QA testing contract (`data-testid` specifications).

## User Stories

1. As Sara, I want to upload a daily support export CSV in the dashboard, so that I can immediately see overall ticket volume and category breakdowns.
2. As Sara, I want repeat messages sent by the same customer with identical text to be deduplicated, so that ticket counts reflect unique customer inquiries.
3. As Sara, I want order IDs formatted with Persian digits (e.g. `BZ-۴۸۲۱۹`) or Latin digits (e.g. `BZ-48219`) to be extracted accurately whether in the order column or message body, so that I can reference customer orders reliably.
4. As Sara, I want messages classified into the 6 standard categories (`delivery`, `payment`, `refund`, `product_quality`, `account`, `other`), so that I understand what problems customers are facing.
5. As Sara, I want to see a single "Needs Attention" list containing all canonical, unanswered high-severity inquiries, so that I can prevent promises from breaking.
6. As Sara, I want the "Needs Attention" list sorted with the most overdue messages at the top, followed by those closest to breaching the 2-business-hour SLA, so that my team prioritizes the most critical tickets first.
7. As Sara, I want each attention row to display the remaining business hours/minutes or overdue duration computed strictly against our Iranian working calendar, so that non-working hours and holidays are never counted against our SLA.
8. As Sara, I want the countdown on the screen to stay live and update at least once a minute using the browser clock without re-uploading the file, so that urgency status is always up to date.
9. As Sara, I want the live countdown and dashboard refreshes to cost zero LLM calls, so that our team does not exhaust our limited LLM quota.
10. As Sara, I want to click "Draft reply" on an urgent ticket to generate a draft only on demand, so that LLM tokens are conserved.
11. As Sara, I want the draft reply to match the customer's language (Persian or English), so that communication is natural and clear.
12. As Sara, I want draft replies to strictly avoid promising refunds, payments, compensation, amounts, or specific dates, so that customers are not misled before manual authorization.
13. As Sara, I want unsafe or failed drafts to be blocked with clear warnings displayed in the UI rather than showing misleading text or crashing the application, so that I know manual intervention is needed.
14. As Sara, I want an editable textarea for the draft so that I can adjust the text before approving it.
15. As Sara, I want an approve button that copies the final approved draft text to my clipboard, so that I can quickly paste and send it.
16. As Sara, I want the dashboard to be presented in Persian with a right-to-left (RTL) layout, while keeping English customer messages readable in LTR, so that our agents work comfortably.
17. As a QA automation engineer, I want the application to expose all required `data-testid` hooks (`upload-input`, `analyze-button`, `urgent-count`, `attention-row`, `draft-button`, `draft-text`, `draft-approve`, `draft-warning`), so that automated smoke tests can drive the dashboard reliably.
18. As a backend operator, I want the CLI `python -m app.cli analyze` to execute unchanged and output valid JSON reports, so that nightly automated batches run seamlessly.
19. As an evaluator, I want a `predictions.csv` generated for `eval_messages.csv` at reference time `2026-04-15T07:00:00Z`, so that classification and urgency performance can be benchmarked.

## Implementation Decisions

1. **Working Calendar & SLA Calculation**:
   - Working days: Saturday to Wednesday.
   - Working hours: 09:00 to 17:00 Asia/Tehran time (+03:30).
   - Weekends (Thursday and Friday) and official 1405 Solar Hijri holidays are non-working days.
   - The 26 official holidays of 1405 are explicitly mapped to Gregorian dates (2026-03-21 to 2027-03-20) in a lookup set shared by business logic.
   - Default `URGENT_SLA_BUSINESS_HOURS` is set to `2.0` (both in code configuration and docker-compose).
   - An unanswered high-severity message is urgent if elapsed business hours >= 2.0.
   - The same business hours arithmetic is ported to TypeScript for client-side countdowns.

2. **Order Reference Extraction**:
   - All Persian digits (`۰-۹`) and Arabic digits (`٠-٩`) in order references and bodies are normalized to ASCII digits (`0-9`).
   - Regex matches `BZ-` followed by digits (case-insensitive) and formats as `BZ-<ascii-digits>`.

3. **Classification & Ingestion**:
   - Ingestion loads required columns and validates timestamps in UTC.
   - Deduplication groups by `customer_id` and normalized message body (Unicode NFC, whitespace collapse, lowercase); the earliest received message is canonical.
   - Classification assigns categories (`delivery`, `payment`, `refund`, `product_quality`, `account`, `other`). When LLM is configured, it classifies canonical messages; fallback uses comprehensive keyword matching.

4. **Draft Reply Generation & Safety**:
   - Prefetching on upload is completely removed. Drafts are generated only on POST `/api/draft`.
   - Customer language is detected (`fa` if Persian characters predominate, otherwise `en`).
   - A robust system prompt commands helpful, polite replies while forbidding financial or schedule commitments.
   - An output validation layer inspects generated drafts for financial/refund commitments, specific amounts, or dates. If detected, or if the LLM endpoint is unreachable, the API returns HTTP 200 with `blocked: true` and descriptive warnings.
   - Untrusted customer inputs are enclosed in delimiter blocks in prompts to mitigate prompt injection.

5. **Frontend Architecture & Contracts**:
   - Page direction is set to `dir="rtl"` with Persian typography and labels.
   - English message excerpts are wrapped with `dir="ltr"` / `dir="auto"`.
   - A React timer hook re-evaluates the client-side business minutes remaining every 30-60 seconds.
   - Needs Attention list includes all canonical, unanswered high-severity messages, sorted in ascending order of business minutes left (most overdue first).
   - `data-testid` specifications are strictly implemented:
     - `upload-input`: CSV file input.
     - `analyze-button`: Submission trigger.
     - `urgent-count`: Displays the live count of overdue items.
     - `attention-row`: Carries `data-message-id` and integer `data-business-minutes-left`.
     - `draft-button`: Triggers draft generation.
     - `draft-text`: `<textarea>` element displaying editable draft.
     - `draft-approve`: Button copying draft to clipboard.
     - `draft-warning`: Element containing failure/blocked message when draft generation is blocked.

6. **Deliverables**:
   - `predictions.csv`: Evaluated using CLI on `data/eval_messages.csv` with `--now 2026-04-15T07:00:00Z`.
   - `WRITEUP.md`: Executive engineering writeup covering assumptions, root-cause diagnostics, and safety analysis.

## Testing Decisions

- Tests test observable behavior against external interfaces (CLI outputs, API response schemas, and DOM testids), avoiding internal implementation coupling.
- Test suites:
  - `backend/tests/test_sla.py`: Iranian weekdays, working hours, weekends, and holiday intervals.
  - `backend/tests/test_orders.py`: Persian digits, lowercase prefixes, and body extraction.
  - `backend/tests/test_api.py`: Upload without prefetch, `/api/draft` safety and blocked states.
  - `frontend/src/sla.test.ts`: Client-side business minutes calculation against boundary dates.
  - `frontend/src/components.test.tsx`: QA contract attributes, textarea editing, approve copying, and warning rendering.

## Out of Scope

- Sending outbound emails or direct message transmissions (approving only copies to clipboard).
- Relational database persistence or historical message archives.
- Modifying the CLI command signature or JSON schema.

## Further Notes

- The system operates fully offline without LLM credentials, defaulting to deterministic rules for classification and safe blocked status for drafts.
