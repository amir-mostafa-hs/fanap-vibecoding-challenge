# Getting Started & Quickstart Guide

This guide walks you through setting up and running the Bazarcheh Support Triage platform locally.

---

## 1. Prerequisites

- **Docker & Docker Compose:** Version 20.10+ (Docker Desktop on macOS/Windows, or Docker Engine on Linux).
- **Make:** Standard GNU Make utility (available on macOS and Linux by default).
- **Optional for Local Dev:** Python 3.12+, Node.js 20+, npm.

---

## 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Ensure `.env` contains your OpenAI-compatible LLM credentials:

```bash
URGENT_SLA_BUSINESS_HOURS="2"
LLM_BASE_URL="https://ai.boxapi.ir/v1"
LLM_API_KEY="your-api-key"
LLM_MODEL="gpt-4o-mini"
```

*Note:* If `LLM_BASE_URL` is omitted, the backend automatically uses rule-based keyword classification without crashing.

---

## 3. Starting the Services

Run the single-command starter:

```bash
make up
```

Or using Docker Compose directly:

```bash
docker compose up -d
```

Once started, the services are reachable at:
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** `curl http://localhost:5173/api/health`

---

## 4. Makefile Command Reference

Run `make` or `make help` to inspect all available lifecycle commands:

| Command | Action |
|---|---|
| `make up` | Start all services in the background |
| `make up-build` | Rebuild images and start services |
| `make down` | Stop and remove running containers |
| `make restart` | Restart all containers |
| `make logs` | Stream logs from all services (`docker compose logs -f`) |
| `make ps` | Inspect running container status |
| `make test` | Run all test suites (Backend via Docker + Frontend via Vitest) |
| `make test-backend` | Run backend Pytest suite in Docker |
| `make test-frontend` | Run frontend Vitest suite locally |
| `make analyze` | Run nightly batch CLI on sample data |
| `make eval-cli` | Run batch CLI evaluation on `eval_messages.csv` |
| `make generate-predictions` | Re-generate `predictions.csv` from evaluation export |
| `make clean` | Clean Python byte-caches and build artifacts |
