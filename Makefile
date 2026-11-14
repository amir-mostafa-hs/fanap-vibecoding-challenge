.DEFAULT_GOAL := help

# Variables
SHELL := /bin/bash
DOCKER_COMPOSE := docker compose
PYTHON := python3
NPM := npm

.PHONY: help up up-build down restart logs ps build \
        test test-backend test-backend-local test-frontend \
        frontend-install frontend-dev frontend-build \
        backend-install backend-dev \
        analyze eval-cli generate-predictions \
        clean

help: ## Display this help message with all available commands
	@echo "========================================================================"
	@echo " Bazarcheh Support Triage Dashboard - Available Commands"
	@echo "========================================================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo "========================================================================"

# -----------------------------------------------------------------------------
# Docker Lifecycle
# -----------------------------------------------------------------------------

up: ## Start all services in background (Backend: 8000, Frontend: 5173)
	$(DOCKER_COMPOSE) up -d

up-build: ## Rebuild images and start all services in background
	$(DOCKER_COMPOSE) up -d --build

down: ## Stop and remove containers and networks
	$(DOCKER_COMPOSE) down

restart: ## Restart all running containers
	$(DOCKER_COMPOSE) restart

logs: ## Follow live logs from all containers
	$(DOCKER_COMPOSE) logs -f

ps: ## View status of running containers
	$(DOCKER_COMPOSE) ps

build: ## Build all Docker images
	$(DOCKER_COMPOSE) build

# -----------------------------------------------------------------------------
# Testing
# -----------------------------------------------------------------------------

test: test-backend test-frontend ## Run all test suites (Backend via Docker + Frontend via Vitest)

test-backend: ## Run backend pytest suite inside Docker container
	$(DOCKER_COMPOSE) run --rm backend pytest

test-backend-local: ## Run backend pytest suite locally
	pytest backend/tests

test-frontend: ## Run frontend test suite via Vitest
	$(NPM) test --prefix frontend

# -----------------------------------------------------------------------------
# Frontend Local Development
# -----------------------------------------------------------------------------

frontend-install: ## Install frontend dependencies
	$(NPM) install --prefix frontend

frontend-dev: ## Run frontend Vite development server locally
	$(NPM) run dev --prefix frontend

frontend-build: ## Type-check and build production bundle
	$(NPM) run build --prefix frontend

# -----------------------------------------------------------------------------
# Backend Local Development
# -----------------------------------------------------------------------------

backend-install: ## Install backend Python dependencies locally
	$(PYTHON) -m pip install -r backend/requirements.txt

backend-dev: ## Run backend FastAPI dev server locally with auto-reload
	uvicorn app.main:app --app-dir backend --reload --port 8000

# -----------------------------------------------------------------------------
# CLI & Batch Evaluation
# -----------------------------------------------------------------------------

analyze: ## Run batch CLI analysis on sample data and write JSON report
	$(DOCKER_COMPOSE) run --rm backend python -m app.cli analyze \
		--input /data/messages_sample.csv \
		--output /data/analysis_sample.json \
		--now 2026-10-26T10:30:00Z

eval-cli: ## Run batch CLI evaluation on eval_messages.csv at reference time
	$(DOCKER_COMPOSE) run --rm backend python -m app.cli analyze \
		--input /data/eval_messages.csv \
		--output /data/eval_output.json \
		--now 2026-04-15T07:00:00Z

generate-predictions: ## Re-generate predictions.csv from evaluation dataset
	$(DOCKER_COMPOSE) run --rm backend python -c '\
import json, csv, sys; \
from pathlib import Path; \
from app.analysis import analyze, parse_now; \
rep = analyze(Path("/data/eval_messages.csv"), now=parse_now("2026-04-15T07:00:00Z")); \
with open("/data/../predictions.csv", "w", newline="", encoding="utf-8") as f: \
    w = csv.writer(f); \
    w.writerow(["message_id", "category", "is_urgent"]); \
    for m in rep["messages"]: \
        w.writerow([m["message_id"], m["category"], str(m["is_urgent"]).lower()]); \
print("predictions.csv generated successfully.")'

# -----------------------------------------------------------------------------
# Cleanup
# -----------------------------------------------------------------------------

clean: ## Remove Python cache files, build artifacts, and temporary directories
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf frontend/dist frontend/.vite
	@echo "Cleaned cache and build directories."
