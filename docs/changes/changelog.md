# Changelog & Implementation History

All vertical slices, bug fixes, and performance enhancements across the project lifecycle:

---

## Initial Challenge Deliverables

- **Ticket 01 (`0771540`):** Iranian calendar SLA engine and client-side countdown timer.
  - Implemented 1405 public holidays and Saturday–Wednesday (09:00–17:00) business hours math in both Python and TypeScript.
  - Zero-quota client-side countdown timer updating every 30 seconds.
- **Ticket 02 (`ddf28c6`):** Persian & Arabic numeral order reference extraction.
  - Built regex extraction and numeral normalization (`str.maketrans`) supporting `BZ-` followed by ASCII, Persian, or Arabic digits.
- **Ticket 03 (`76e95fb`):** Safe on-demand AI reply drafts & QA hooks.
  - Implemented `/api/draft` with strict regex guardrails prohibiting financial commitments and firm dates.
  - Eliminated upload prefetching to conserve quota.
- **Ticket 04 (`f5ada9a`):** Persian RTL dashboard redesign.
  - Applied full right-to-left layout (`dir="rtl"`), attention list urgency sorting, and QA test attributes.
- **Ticket 05 (`9bf0db2`):** Evaluation deliverables & documentation.
  - Produced `predictions.csv` for `data/eval_messages.csv` at reference time `2026-04-15T07:00:00Z`.
  - Authored comprehensive engineering report `WRITEUP.md`.
- **Review Remediation (`66d8458`):**
  - Exported AI conversation sessions to `AI_LOGS/`.
  - Added Persian/Arabic digit highlighting to message table.
  - Added Finglish language detection and fixed countdown timer clobbering.

---

## Infrastructure & Performance Enhancements

- **Makefile Addition (`0909726`):**
  - Introduced unified `Makefile` providing self-documenting targets for Docker lifecycle, tests, and CLI analysis.
- **504 Gateway Timeout Resolution (`55cc9c0`):**
  - Diagnosed serial HTTP bottleneck in LLM categorization (30 batches × 4.6s = 138s exceeding 120s Nginx timeout).
  - Parallelized batch classification using `ThreadPoolExecutor(max_workers=6)` reducing processing time from 138s to 34.9s.
  - Increased Nginx read timeout to 180s as safety buffer.

---

## Usability & Streaming Enhancements

- **Ticket 01 - Attention List Clarity (`3087ed2`):**
  - Clarified relationship between 30 urgent messages and 51 total attention inquiries ($30 + 21 = 51$).
  - Added 4-tile summary cards with explanatory context banner.
  - Added interactive filter tabs ("همه", "فوری و معوق", "در مهلت تعهد") and distinctive red/amber row badges.
- **Ticket 02 - Live SSE Progress Streaming (`39a0e5d`):**
  - Implemented Server-Sent Events on `/api/analyze?stream=true`.
  - Built real-time progress emitter tracking worker thread chunk completion.
  - Added interactive percentage progress bar and status message checklist in frontend upload form.
- **Code Standards & Cleanup (`90069ad`):**
  - Removed all Persian comments from codebase files and translated Makefile descriptions to English.
  - Pruned trivial and redundant comments, leaving only necessary comments on complex SLA and safety logic in English.
