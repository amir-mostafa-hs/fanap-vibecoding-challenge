# 05: Evaluation Deliverables (predictions.csv & WRITEUP.md)

**What to build:** Generate `predictions.csv` for `data/eval_messages.csv` using the CLI at reference time `2026-04-15T07:00:00Z`. Author the comprehensive one-page engineering analysis `WRITEUP.md` addressing problem definition, assumptions, root-cause bug diagnostics in the legacy codebase, omitted items, AI tool reflections, and safety guarantees.

**Blocked by:** 01 (SLA Engine & Iranian Calendar with Live Countdown), 02 (Persian Digit Order Reference Extraction & Dedup), 03 (Safe On-Demand AI Drafts & QA Hooks), 04 (Persian RTL Dashboard Redesign & Attention List Ordering)

**Status:** ready-for-agent

- [ ] CLI runs successfully on `data/eval_messages.csv` with `--now 2026-04-15T07:00:00Z`.
- [ ] `predictions.csv` created with header `message_id,category,is_urgent` matching all evaluated rows.
- [ ] `WRITEUP.md` created covering:
  - Real problem understanding.
  - Assumptions made.
  - Identification and diagnostics of legacy code bugs.
  - What was cut and why.
  - Reflections on where AI tools misled or assisted.
  - LLM classification quality validation.
  - Safety verification for AI reply drafts shown to Sara.
- [ ] Single-command startup (`docker compose up`) verified.
