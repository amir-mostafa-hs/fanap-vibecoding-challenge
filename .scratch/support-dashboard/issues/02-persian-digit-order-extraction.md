# 02: Persian Digit Order Reference Extraction & Dedup

**What to build:** Reliable order reference extraction that supports both Persian/Eastern-Arabic digits (e.g. `BZ-۴۸۲۱۹`) and standard ASCII digits (e.g. `BZ-48219`), scanned from the `order_ref` column and fallback message body, normalizing to standard `BZ-<digits>`. Preserve deduplication of identical text from the same customer.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Digits in Persian (`۰-۹`) and Arabic (`٠-٩`) normalized to ASCII digits (`0-9`).
- [ ] Pattern extracts order references prefixed with `BZ-` (case-insensitive) whether in the order field or inside message body.
- [ ] Normalized output consistently formats as uppercase `BZ-<ascii-digits>`.
- [ ] Deduplication correctly marks subsequent identical messages from the same customer as duplicates.
- [ ] Automated tests cover Persian digits, lowercase `bz-`, body extraction, and non-order messages.
