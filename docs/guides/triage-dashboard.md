# Support Dashboard User Guide

This guide is designed for Sara and the support triage operators to navigate, analyze, and prioritize daily customer support message exports.

---

## 1. Uploading & Analyzing an Export

1. Open your browser at **[http://localhost:5173](http://localhost:5173)**.
2. In the **فایل پشتیبانی (CSV)** input, select your export file (e.g., `data/messages_sample.csv` or `data/eval_messages.csv`).
3. Set the **زمان مبنای ارزیابی (اختیاری - UTC)** field:
   - For `messages_sample.csv`: enter `2026-08-24 07:00` (10:30 AM Tehran time).
   - For `eval_messages.csv`: enter `2026-04-15 07:00` (10:30 AM Tehran time).
   - If left empty, the dashboard defaults to the current real time.
4. Click **تحلیل فایل (Analyze)**.
5. The live streaming widget displays real-time progress across data ingestion, deduplication, AI classification batches, and SLA calculations.

---

## 2. Understanding Metrics & Summary Tiles

| Metric Tile | Meaning & Description |
|---|---|
| **پیام‌های یکتا (۵۹۷)** | Total unique customer messages after deduplicating repeated resends. |
| **🚨 فوری و معوق (۳۰)** | Inquiries where more than 2.0 business hours have elapsed without a reply (`is_urgent = true`). |
| **⏳ در مهلت تعهد (۲۱)** | Inquiries with high severity that are still within their 2-hour window. |
| **📋 کل صف نیازمند توجه (۵۱)** | Sum of all high-severity, canonical, unanswered customer messages ($30 + 21 = 51$). |

---

## 3. Working the Needs Attention Queue

The Attention List displays high-severity inquiries sorted in order of urgency:
- Messages that have already breached the 2-hour SLA appear at the top with a **🚨 فوری (از موعد گذشته)** red badge and elapsed overtime.
- Messages nearing breach appear next with a **⏳ در مهلت تعهد** amber badge and a live countdown timer.

### Filtering by Status
Use the top interactive tabs to narrow your focus:
- **همه (۵۱):** Full queue.
- **🚨 فوری و معوق (۳۰):** Focus on breached tickets requiring immediate intervention.
- **⏳ در مهلت تعهد (۲۱):** Preemptively resolve tickets before they breach SLA.

---

## 4. AI-Powered Reply Drafts

1. On any row in the attention list, click **پیش‌نویس پاسخ هوشمند**.
2. The AI generates a customized draft in the customer's language (Persian or English).
3. **Safety Guarantee:** The system prohibits promises of money, compensation, refund amounts, or firm delivery dates. If an unsafe draft is generated, it is automatically blocked and a clear warning is displayed.
4. Review and edit the draft inside the text area.
5. Click **تایید و کپی متن** to copy the final response to your clipboard for sending to the customer.
