# Nightly Batch Job CLI Reference

The CLI module (`backend/app/cli.py`) powers the automated nightly triage batch process. Downstream reporting pipelines rely on its exact invocation signature and output JSON schema.

---

## 1. Invocation Syntax

Run the CLI inside the backend container:

```bash
docker compose run --rm backend python -m app.cli analyze \
  --input /data/messages_sample.csv \
  --output /data/out.json \
  --now 2026-10-26T10:30:00Z
```

### Parameters

- `--input <path>` (Required): Path to the input support export CSV file (accessible within the container, typically under `/data`).
- `--output <path>` (Required): Destination path where the resulting JSON report will be written.
- `--now <iso-8601>` (Optional): Reference timestamp for SLA calculation in ISO-8601 UTC format. Defaults to the current UTC timestamp if omitted.

---

## 2. Output Schema (`out.json`)

The output JSON file conforms to the following contract:

```json
{
  "total_unique_messages": 597,
  "category_counts": {
    "delivery": 183,
    "payment": 98,
    "refund": 92,
    "product_quality": 80,
    "other": 79,
    "account": 65
  },
  "urgent_message_ids": [
    "M05b1b477",
    "M05bd0b79",
    "..."
  ],
  "messages": [
    {
      "message_id": "M2c2e5e10",
      "category": "delivery",
      "is_urgent": false,
      "order_ref": "BZ-932252",
      "duplicate_of": null
    },
    {
      "message_id": "M014e6d4c",
      "category": "refund",
      "is_urgent": false,
      "order_ref": "BZ-298694",
      "duplicate_of": null
    }
  ]
}
```

### Field Definitions

- `total_unique_messages`: Count of non-duplicate (canonical) messages.
- `category_counts`: Mapping of category names to message counts among unique messages.
- `urgent_message_ids`: Sorted list of message IDs deemed urgent at `--now`.
- `messages`: List of message objects in the original order of the CSV export:
  - `message_id`: Message identifier.
  - `category`: Assigned category (`delivery`, `payment`, `refund`, `product_quality`, `account`, `other`).
  - `is_urgent`: Boolean indicating whether the 2-hour SLA promise was breached.
  - `order_ref`: Extracted and normalized order code (`BZ-...`) or `null`.
  - `duplicate_of`: Identifier of the original message if marked as a duplicate, otherwise `null`.
