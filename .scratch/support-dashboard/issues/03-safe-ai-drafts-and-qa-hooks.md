# 03: Safe On-Demand AI Drafts & QA Hooks

**What to build:** On-demand AI reply draft generation triggered only when Sara clicks "Draft reply" (prefetching on upload removed). Drafts respond in the customer's language (Persian or English) and enforce strict safety guardrails preventing promises of refunds, payments, compensation, amounts, or dates. If unsafe or if the LLM is unreachable, the API returns HTTP 200 with `blocked: true` and descriptive warnings. In the UI, the draft is displayed in an editable `<textarea data-testid="draft-text">`, an approve button `<button data-testid="draft-approve">` copies text to clipboard, and `<div data-testid="draft-warning">` displays warnings when blocked.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Prefetching drafts during upload/analyze pipeline completely removed.
- [ ] Language detected as `fa` for Persian messages and `en` for English messages.
- [ ] Safe prompt and output validation ensure no unauthorized financial or scheduling promises are made.
- [ ] Endpoint `/api/draft` returns HTTP 200 with `blocked: true` and warning details when safety is breached or LLM is unavailable.
- [ ] UI features an editable `<textarea data-testid="draft-text">`.
- [ ] UI features a `<button data-testid="draft-approve">` that copies approved draft to clipboard.
- [ ] UI displays `<div data-testid="draft-warning">` when draft is blocked or fails.
- [ ] Automated tests verify language detection, blocked safety states, graceful error handling, and QA testid hooks.
