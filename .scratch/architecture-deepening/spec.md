# Architecture Deepening Specification: Refactoring Shallow Modules & Eliminating Friction

## Problem Statement

The Bazarcheh support triage dashboard has grown organically through multiple feature additions (order reference extraction, Persian/Arabic digit normalization, deduplication, LLM classification, Iranian business calendar SLA calculations, SSE streaming, and Persian RTL UI). While functionality is verified and tests pass, the current codebase exhibits structural friction:
1. **Shallow pass-through modules:** `urgency.py` (27 lines), `orders.py` (28 lines), and `dedup.py` (48 lines) are thin wrappers whose interface complexity matches their implementation size. They fail the deletion test.
2. **Duplicated pipeline logic:** `analysis.py` maintains two parallel implementations of the enrichment and classification loop: one in `enrich()` for batch processing, and another in `analyze_stream()` for SSE streaming.
3. **Dual calendar engines across the HTTP seam:** The Iranian working schedule (Saturday–Wednesday, 09:00–17:00 Tehran time) and 26 official 1405 public holidays are duplicated between Python (`backend/app/sla.py`) and TypeScript (`frontend/src/sla.ts`) because the backend only emits a snapshot boolean `is_urgent`, forcing the frontend to re-implement the entire calendar engine for client-side countdowns.
4. **State leakage across UI components:** `App.tsx` manually filters, sorts, and extracts `attentionMessages`, `attentionIds`, and `urgentCount`, passing redundant props down to `AttentionList.tsx`, which then reconstructs an internal Map and re-computes business minutes left on every item.

## Solution

Restructure the codebase into **deep modules** with small, high-leverage interfaces:
1. **Deep Intake Module:** Consolidate message loading, schema validation, Persian/Arabic digit normalization, order reference parsing, and deduplication into a unified `intake` module that produces canonical message records.
2. **Deep SLA Module & Unified Pipeline:** Absorb `urgency.py` into `sla.py`. Add deterministic SLA deadline calculation (`sla_deadline_at`), and unify `analyze()` and `analyze_stream()` to share a single generator-driven pipeline.
3. **Deep Attention Queue & Authoritative Deadlines:** Encapsulate candidate filtering, sorting, tab state, draft requests, and metric counters within a deep frontend Attention Queue module. Drive client-side countdowns directly from backend-provided `sla_deadline_at` timestamps, deprecating the duplicate holiday engine in TypeScript.

## User Stories

1. As a triage operator, I want all support messages to be ingested, normalized (digits, Unicode NFC), and deduplicated through a single reliable intake pipeline, so that duplicate customer queries never clutter my triage queue.
2. As a triage operator, I want order reference numbers (e.g., `BZ-12345`) to be reliably identified whether they appear in the dedicated column or within the message body with Persian/Arabic numerals, so that I can look up orders instantly.
3. As a triage operator, I want the system to compute exact SLA deadlines based on official Iranian business hours and holidays, so that I know exactly when a high-severity message will breach its commitment.
4. As a triage operator, I want live countdowns on the dashboard to tick accurately without causing network traffic or LLM calls, so that the interface remains responsive.
5. As a triage operator, I want the dashboard to distinguish between overdue messages and messages approaching their deadline with clear tabs and badges, so that I can prioritize immediate risks first.
6. As a triage operator, I want the summary tiles to show mutually consistent numbers for total attention items, overdue urgent items, and approaching deadline items, so that I have complete confidence in triage metrics.
7. As a backend developer, I want `analyze()` and `analyze_stream()` to execute the exact same pipeline stages, so that bug fixes and enhancements in one immediately apply to both.
8. As a backend developer, I want `urgency.py` folded into `sla.py`, so that all SLA rules, urgency determinations, and business calendar calculations reside in one cohesive module.
9. As a frontend developer, I want the backend API to return authoritative `sla_deadline_at` timestamps for each message, so that the frontend doesn't need to maintain a separate 147-line copy of Iranian public holidays.
10. As a frontend developer, I want `App.tsx` to act as a clean page coordinator rather than calculating queue sorting and filtering, so that the UI architecture is easy to navigate and extend.
11. As a maintainer, I want tests to exercise deep interfaces rather than mocking shallow helper functions, so that refactoring internal implementations doesn't break external tests.
12. As a QA automation engineer, I want all existing test hooks (`data-testid="urgent-count"`, `data-testid="attention-row"`, `data-testid="draft-button"`) to remain fully functional, so that automated smoke tests pass without modification.

## Implementation Decisions

1. **Intake Seam:**
   - Consolidate `orders.py`, `dedup.py`, and `ingest.py` into a unified intake boundary within `backend/app/ingest.py` (or `intake.py`).
   - The interface accepts raw CSV sources and emits a canonical, normalized DataFrame with validated columns, extracted `order_ref`, and computed `duplicate_of`.
   - Remove standalone shallow files `orders.py` and `dedup.py` after redirecting internal callers and unit tests.

2. **SLA & Urgency Seam:**
   - Fold `is_urgent` directly into `backend/app/sla.py`. Delete `backend/app/urgency.py`.
   - Add `calculate_sla_deadline(received_at: datetime, sla_hours: float = 2.0) -> datetime` to `backend/app/sla.py`, computing the exact Tehran-time business expiry timestamp.
   - Include `sla_deadline_at` (formatted as ISO-8601 UTC string) in the serialized message dictionary returned by `build_report()`.

3. **Pipeline Unification:**
   - Refactor `backend/app/analysis.py` so that `analyze_stream()` is the single execution engine yielding structured step events (`ingest`, `dedup`, `classify`, `sla`, `complete`).
   - `analyze()` becomes a lightweight wrapper that drains the generator from `analyze_stream()` and returns the final report payload, eliminating all duplicated enrichment code.

4. **Frontend Attention Queue Seam:**
   - Deepen `AttentionList.tsx` (and/or provide a dedicated `useAttentionQueue` hook) that accepts the raw `messages: Message[]` and `now: Date`.
   - Encapsulate the filtering of candidates (high severity, canonical, unanswered), sorting by urgency, tab switching (`all`, `urgent`, `approaching`), and count aggregation behind this single interface.
   - Simplify `App.tsx` to pass `messages={result.messages}` and receive counts or let `AttentionList` render them cohesively.

5. **Client-Side SLA Calculation Simplification:**
   - When `sla_deadline_at` is provided by the API, `computeBusinessMinutesLeft` in `frontend/src/sla.ts` uses wall-clock diff against `sla_deadline_at`, retaining the fallback calendar calculation for backward compatibility.

## Testing Decisions

- **Test Surface:** All tests must verify external behavior through public module interfaces:
  - Intake tests verify that dirty CSV input produces correct canonical columns, normalized digits, and duplicate links.
  - SLA tests verify business hour calculation, holiday skipping, deadline timestamps, and urgency determination through `backend/app/sla.py`.
  - Pipeline tests verify that batch `analyze()` and streaming `analyze_stream()` produce identical final reports.
  - Frontend component tests verify filtering, sorting, tab clicks, draft requests, and countdown updates via Vitest and Testing Library.
- **Regression Protection:** Ensure `make test-backend` (all 27 tests) and `make test-frontend` (all 17 tests) continue to pass green throughout each step.

## Out of Scope

- Changing the underlying LLM prompt templates or model provider.
- Altering the REST API route paths (`/api/analyze`, `/api/draft`, `/api/health`).
- Modifying the visual design, RTL layout, or styling theme.
- Supporting multi-tenant calendar configurations beyond the 1405 Iranian calendar.

## Further Notes

- All changes will be executed iteratively using tracer-bullet vertical slices.
- Code comments will strictly adhere to the project standard: concise English, reserved only for complex or sensitive business logic, with zero Persian comments in source code.
