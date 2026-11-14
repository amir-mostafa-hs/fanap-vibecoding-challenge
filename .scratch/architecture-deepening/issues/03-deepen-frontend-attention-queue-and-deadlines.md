# 03: Deepen Frontend Attention Queue and Consume Authoritative Deadlines

**What to build:** A deepened Attention Queue module/hook in the frontend that accepts raw messages and reference clock from `App.tsx`, encapsulating candidate filtering (high-severity, canonical, unanswered), sorting by urgency, tab switching (`all`, `urgent`, `approaching`), and metric tallies. Update the countdown calculation to consume the backend-provided `sla_deadline_at`, removing the need for duplicate calendar and holiday calculations in the frontend and eliminating redundant props (`ids` + `messages`) between components.

**Blocked by:** 02: Deepen SLA Module, Collapse Urgency, and Unify Analysis Pipeline

**Status:** ready-for-agent

- [ ] `AttentionList.tsx` (and/or an associated hook) manages its own filtering, sorting, tab state, and metric counts from raw messages without requiring `App.tsx` to pre-calculate and pass redundant `attentionIds` and `urgentCount`.
- [ ] Client countdowns consume `sla_deadline_at` from message objects to compute minutes left directly, deprecating duplicate calendar maintenance.
- [ ] `App.tsx` interface shrinks to pass only the analysis messages and clock.
- [ ] All frontend unit tests pass (`make test-frontend`), and interactive tab filtering and countdowns work as expected.
