# 01: Consolidate Message Intake, Digit Normalization, and Deduplication

**What to build:** A unified, deep intake module that takes raw CSV data (or file buffers) and outputs a clean, schema-validated DataFrame with normalized Persian/Arabic digits, extracted order references (from explicit columns or message bodies), and duplicate links mapped to canonical messages. This eliminates the shallow `orders.py` and `dedup.py` files and removes manual column iteration loops from the analysis pipeline.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Message loading, CSV validation, Persian/Arabic digit normalization, order reference parsing, and deduplication logic are unified within a deep intake interface (`backend/app/ingest.py`).
- [x] Shallow helper modules `backend/app/orders.py` and `backend/app/dedup.py` are deprecated and absorbed.
- [x] Callers in `analysis.py` invoke a single intake step rather than coordinating multiple manual string transformations across DataFrame columns.
- [x] All existing intake, orders, and deduplication unit tests pass without regression against the consolidated module.
