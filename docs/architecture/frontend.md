# Frontend Architecture & User Interface

The frontend is a single-page application built with **React 18**, **TypeScript**, and **Vite**, served via Nginx in production.

---

## 1. Directory Structure

```text
frontend/src/
├── App.tsx                   # Main application container & state management
├── api.ts                    # HTTP client for REST & Server-Sent Events (SSE)
├── main.tsx                  # React entry point
├── styles.css                # Custom CSS styling (RTL layout, badges, tabs, progress)
├── types.ts                  # Shared TypeScript interfaces & types
├── sla.ts                    # Client-side Iranian calendar & business minutes calculator
├── format.ts                 # Time and number formatting helpers
└── components/
    ├── UploadForm.tsx        # File upload form with animated progress bar
    ├── SummaryTiles.tsx      # Metrics breakdown tiles with explanatory context notes
    ├── AttentionList.tsx     # Filterable attention list with live countdowns & AI drafts
    ├── CategoryBreakdown.tsx # Category distribution chart & percentages
    └── MessagesTable.tsx     # Full paginated message table with highlighted order IDs
```

---

## 2. Key Architecture Features

### Right-to-Left (RTL) Layout
- The entire page operates under `dir="rtl"` with Persian typography.
- Mixed-language customer content (such as English subjects, bodies, and order IDs) is isolated using `dir="auto"` or `dir="ltr"` inside table cells and code spans to prevent punctuation flip.

### Zero-Quota Live SLA Countdown
- To protect limited AI quota from continuous background polling, the full Iranian working calendar and business-hours arithmetic is implemented in TypeScript (`sla.ts`).
- An active React interval timer ticks every 30 seconds, recalculating `business_minutes_left` purely in-memory.
- Simulated evaluation timestamps entered during testing freeze the reference clock, ensuring repeatable automated QA runs.

### Real-Time Streaming Progress Widget
- Consumes incoming SSE events from `/api/analyze?stream=true` using the browser's native `ReadableStreamDefaultReader`.
- Renders an animated progress bar indicating exact completion percentage (`0%` to `100%`) alongside detailed status descriptions (e.g., "بسته ۳ از ۶ تکمیل شد").

### Interactive Attention Tabs & Visual Badges
- Resolves operator confusion between total attention items and overdue items by providing interactive filter tabs:
  - **همه (۵۱):** Displays all high-severity canonical unanswered inquiries.
  - **🚨 فوری و معوق (۳۰):** Displays only inquiries whose 2-hour SLA has already elapsed.
  - **⏳ در مهلت تعهد (۲۱):** Displays inquiries currently approaching their deadline.
- Renders distinct red and amber badges on each row for immediate visual identification.
