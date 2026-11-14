# 04: End-to-End Verification and Contract Hardening

**What to build:** Complete end-to-end verification across Docker containers, the CLI batch tool, the SSE streaming endpoint, and the frontend web UI. Verify that all automated QA hooks (`data-testid="urgent-count"`, `data-testid="attention-row"`, `data-testid="draft-button"`) continue to function without alteration, and clean up any remaining dead code or deprecated exports.

**Blocked by:** 03: Deepen Frontend Attention Queue and Consume Authoritative Deadlines

**Status:** ready-for-agent

- [x] All 27 backend tests and 17 frontend tests pass cleanly (`make test`).
- [x] Automated smoke test hooks (`data-testid`) remain strictly functional and intact.
- [x] CLI batch analysis (`make analyze`) processes sample datasets identically to the web interface.
- [x] Docker container build and live execution run cleanly without runtime warnings or errors.
- [x] No Persian comments or superfluous code remain in any source file.
