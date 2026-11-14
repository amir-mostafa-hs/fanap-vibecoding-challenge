# 01: Attention List Clarity, Filter Tabs & Metrics Breakdown

**What to build:** Clarify the relationship between the 30 urgent messages and the 51 total messages requiring attention. Update the summary tiles to show both Urgent (breached SLA) and Approaching Deadline metrics alongside unique messages and total attention queue. Add interactive filter tabs ("همه", "فوری / معوق", "در مهلت تعهد") to the Needs Attention list with distinctive visual badges (red for overdue, amber for approaching). Ensure `data-testid="urgent-count"` and attention row QA test attributes remain fully compliant.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Update `SummaryTiles.tsx` to display:
  - Total unique messages (`data-testid="total"`)
  - Urgent / overdue messages (`data-testid="urgent-count"`)
  - Approaching deadline messages (under 2 hours)
  - Total attention queue count with an explanatory Persian subtitle
- [x] Update `AttentionList.tsx` with filter tabs:
  - "همه (X)"
  - "فوری و معوق (Y)"
  - "در مهلت تعهد (Z)"
- [x] Add distinct visual badges to attention list items:
  - `🚨 فوری (از موعد گذشته)` for items with `left <= 0`
  - `⏳ در مهلت تعهد` for items with `left > 0`
- [x] Preserve all QA hooks (`data-testid="urgent-count"`, `data-testid="attention-row"`, `data-message-id`, `data-business-minutes-left`, `draft-button`, `draft-text`, etc.)
- [x] Unit tests in `frontend/src/` verify filter tabs and tile rendering.
