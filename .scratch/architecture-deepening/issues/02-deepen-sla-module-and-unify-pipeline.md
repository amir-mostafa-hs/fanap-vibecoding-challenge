# 02: Deepen SLA Module, Collapse Urgency, and Unify Analysis Pipeline

**What to build:** A deepened SLA module in `backend/app/sla.py` that encapsulates all Iranian business hours calculations, 1405 public holidays, urgency evaluation rules, and deterministic SLA deadline calculations (`sla_deadline_at`). Simultaneously, delete the shallow `urgency.py` file and unify the analysis pipeline in `backend/app/analysis.py` so that batch `analyze()` drains the exact same stage generator used by streaming `analyze_stream()`, eliminating all duplicate enrichment code.

**Blocked by:** 01: Consolidate Message Intake, Digit Normalization, and Deduplication

**Status:** ready-for-agent

- [x] Shallow `backend/app/urgency.py` is removed; urgency evaluation logic is consolidated into `backend/app/sla.py`.
- [x] `calculate_sla_deadline(received_at, sla_hours)` is added to `backend/app/sla.py` to produce exact ISO-8601 UTC deadline timestamps based on the Iranian business calendar.
- [x] `build_report()` includes `sla_deadline_at` in the output dictionary for each message.
- [x] `analyze()` and `analyze_stream()` in `backend/app/analysis.py` share a single generator execution path, eliminating redundant DataFrame enrichment code.
- [x] All backend unit tests pass (`make test-backend`) and CLI batch analysis works cleanly.
