# 04: Persian RTL Dashboard Redesign & Attention List Ordering

**What to build:** Complete right-to-left (RTL) Persian redesign of the dashboard while preserving left-to-right (LTR) readability for English customer message bodies. Single "Needs Attention" list containing every high-severity, canonical, unanswered message, sorted strictly in order of business urgency (most overdue first, down to those closest to breaching). Full compliance with QA smoke test contracts.

**Blocked by:** 01 (SLA Engine & Iranian Calendar with Live Countdown), 02 (Persian Digit Order Reference Extraction & Dedup), 03 (Safe On-Demand AI Drafts & QA Hooks)

**Status:** ready-for-agent

- [ ] Page direction set to RTL (`dir="rtl"`, `lang="fa"`) with Persian headings, tiles, labels, and category translations.
- [ ] English customer message content remains readable with isolated LTR/auto direction.
- [ ] Needs Attention list displays all canonical, unanswered high-severity messages.
- [ ] Attention list ordered by most overdue first, down to messages closest to breaching.
- [ ] Attention rows provide `data-testid="attention-row"`, `data-message-id`, and `data-business-minutes-left`.
- [ ] File upload and analyze trigger satisfy `data-testid="upload-input"` and `data-testid="analyze-button"`.
- [ ] Urgent counter satisfies `data-testid="urgent-count"` and stays in sync with overdue items in attention list.
- [ ] Automated Vitest component tests verify RTL styling, attention ordering, and QA testid interactions.
