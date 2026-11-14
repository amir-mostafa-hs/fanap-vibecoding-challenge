# Frontend Architecture & User Interface

The frontend is a single-page application built with **React 18**, **TypeScript**, and **Vite**, served via Nginx in production.

---

## 1. Directory Structure

```text
frontend/src/
├── App.tsx                   # Main page coordinator & UI shell
├── api.ts                    # HTTP client for REST & Server-Sent Events (SSE)
├── main.tsx                  # React DOM entry point
├── styles.css                # Custom CSS styling (RTL layout, badges, tabs, progress)
├── types.ts                  # Shared TypeScript interfaces & types
├── sla.ts                    # Business minutes calculator & deadline diff helpers
├── format.ts                 # Time and number formatting helpers
└── components/
    ├── UploadForm.tsx        # File upload form with animated progress bar
    ├── SummaryTiles.tsx      # Metrics breakdown tiles with explanatory context notes
    ├── AttentionList.tsx     # Deep module: Attention queue filtering, sorting, tabs & AI drafts
    ├── CategoryBreakdown.tsx # Category distribution chart & percentages
    └── MessagesTable.tsx     # Full paginated message table with highlighted order IDs
```

---

## 2. Key Architecture Features

### Deep Attention Queue Module (`AttentionList.tsx`)
- **Self-Contained Queue Management:** Encapsulates candidate filtering (canonical, unanswered, high-severity), sorting by urgency, tab selection, and metric tallies behind a clean interface.
- **Zero Prop Leaking:** `App.tsx` passes raw messages and reference clock; `AttentionList` handles all internal state without requiring callers to pass redundant ID arrays or pre-computed counts.
- **Interactive Tabs & Visual Badges:**
  - **همه (۵۱):** Displays all high-severity canonical unanswered inquiries.
  - **🚨 فوری و معوق (۳۰):** Displays inquiries whose 2-hour SLA has already elapsed.
  - **⏳ در مهلت تعهد (۲۱):** Displays inquiries currently approaching their deadline.

### Authoritative Deadline Countdowns (`sla.ts`)
- **$O(1)$ Wall-Clock Calculation:** When the backend provides `sla_deadline_at`, `computeBusinessMinutesLeft` computes remaining minutes directly from the timestamp difference, eliminating complex in-browser calendar loops.
- **Fallback Compatibility:** Retains the full Iranian working calendar engine in TypeScript as an automatic fallback if an older API payload lacks `sla_deadline_at`.
- **Zero-Quota Active Timer:** An interval timer updates every 30 seconds without generating network traffic or LLM calls.

### Real-Time Streaming Progress Widget (`UploadForm.tsx`)
- Consumes incoming SSE events from `/api/analyze?stream=true` using the browser's native `ReadableStreamDefaultReader`.
- Renders an animated progress bar indicating exact completion percentage (`0%` to `100%`) alongside detailed status descriptions.

### Right-to-Left (RTL) Layout & Mixed-Language Isolation
- The entire page operates under `dir="rtl"` with Persian typography.
- Mixed-language customer content (such as English subjects, bodies, and order IDs) is isolated using `dir="auto"` or `dir="ltr"` inside table cells and code spans to prevent punctuation flip.
