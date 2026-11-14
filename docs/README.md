# Documentation Index

Welcome to the **Bazarcheh Support Triage** platform documentation. This repository provides end-to-end documentation covering architecture, operations, API contracts, engineering skills, and changelogs.

---

## 🏛️ Architecture & Core Concepts
- [System Architecture Overview](architecture/overview.md): High-level system design, subsystems, tech stack, and end-to-end data flow.
- [Backend Pipeline & Architecture](architecture/backend.md): Deep intake module, unified generator pipeline, parallel LLM concurrency, and safety guardrails.
- [Frontend Architecture](architecture/frontend.md): Deep Attention Queue module, React 18, RTL Persian typography, and $O(1)$ deadline countdowns.
- [Iranian Calendar & SLA Engine](architecture/calendar-and-sla.md): 26 official 1405 public holidays, Saturday–Wednesday schedule, and deterministic `sla_deadline_at` calculations.

---

## 🚀 User & Developer Guides
- [Getting Started & Quickstart](guides/getting-started.md): Prerequisites, Docker startup, environment variables, and Makefile lifecycle commands.
- [Support Dashboard User Guide](guides/triage-dashboard.md): Operational guide for support operators to triage messages and approve AI drafts.
- [Nightly Batch CLI Reference](guides/cli-batch-job.md): Command-line syntax, parameters, and output JSON report schema.
- [Agent Skills & Workflows Guide](guides/agent-skills.md): Directory of installed agent skills (`.agents/skills/`), slash commands, and the project engineering cycle.

---

## 🔌 API & Test Contracts
- [API Contracts & QA Hooks](api/openapi-contracts.md): REST endpoints (`/api/health`, `/api/analyze`, `/api/draft`), SSE streaming event protocol, and automated smoke test attributes (`data-testid`).

---

## 📈 Changes & Deep Dives
- [Changelog & Iterations](changes/changelog.md): Chronological record of features, performance fixes, and architecture deepening refactors.
- [Performance, Concurrency & Streaming Deep Dive](changes/performance-and-concurrency.md): Diagnostic of the 504 timeout, parallel LLM worker pool, and Server-Sent Events architecture.
- [Architecture Deepening Spec & Tickets](../.scratch/architecture-deepening/spec.md): Specification and completed vertical slice tickets for modular deepening.
