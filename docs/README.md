# Documentation Index

Welcome to the Bazarcheh Support Triage platform documentation.

---

## 🏛️ Architecture & Core Concepts
- [System Architecture Overview](architecture/overview.md): High-level system design, subsystems, tech stack, and end-to-end data flow.
- [Backend Pipeline & Architecture](architecture/backend.md): FastAPI modules, ingestion, deduplication, order extraction, concurrency, and safety guardrails.
- [Frontend Architecture](architecture/frontend.md): React 18, TypeScript, RTL layout, live SLA countdown, and streaming progress UI.
- [Iranian Calendar & SLA Engine](architecture/calendar-and-sla.md): Official 1405 public holidays mapping, working schedule, and 2.0-hour business SLA formula.

---

## 🚀 User & Developer Guides
- [Getting Started & Quickstart](guides/getting-started.md): Prerequisites, Docker startup, environment variables, and Makefile commands.
- [Support Dashboard User Guide](guides/triage-dashboard.md): Operational manual for Sara and support operators on using the dashboard.
- [Nightly Batch CLI Reference](guides/cli-batch-job.md): Command-line syntax, parameters, and output JSON report schema.

---

## 🔌 API & Test Contracts
- [API Contracts & QA Hooks](api/openapi-contracts.md): REST endpoints (`/api/health`, `/api/analyze`, `/api/draft`), SSE streaming event protocol, and automated QA test attributes (`data-testid`).

---

## 📈 Changes & Deep Dives
- [Changelog & Iterations](changes/changelog.md): Complete chronological record of tickets, enhancements, and review remediations.
- [Performance, Concurrency & Streaming Deep Dive](changes/performance-and-concurrency.md): Diagnostic of the 504 timeout, parallel LLM worker pool, and Server-Sent Events architecture.
