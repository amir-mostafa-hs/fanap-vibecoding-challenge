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

help: ## نمایش این راهنما و تمام دستورات موجود
	@echo "========================================================================"
	@echo " Bazarcheh Support Triage Dashboard - دستورات در دسترس پروژه"
	@echo "========================================================================"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo "========================================================================"

# -----------------------------------------------------------------------------
# مدیریت کانتینرها (Docker Lifecycle)
# -----------------------------------------------------------------------------

up: ## اجرای تمام سرویس‌ها در پس‌زمینه (Backend: 8000, Frontend: 5173)
	$(DOCKER_COMPOSE) up -d

up-build: ## بیلد مجدد ایمیج‌ها و اجرای سرویس‌ها در پس‌زمینه
	$(DOCKER_COMPOSE) up -d --build

down: ## متوقف‌سازی و حذف کانتینرها و شبکه‌های داکر
	$(DOCKER_COMPOSE) down

restart: ## ری‌استارت کردن تمام کانتینرها
	$(DOCKER_COMPOSE) restart

logs: ## مشاهده لاگ‌های زنده تمام سرویس‌ها
	$(DOCKER_COMPOSE) logs -f

ps: ## مشاهده وضعیت کانتینرهای در حال اجرا
	$(DOCKER_COMPOSE) ps

build: ## بیلد ایمیج‌های داکر پروژه
	$(DOCKER_COMPOSE) build

# -----------------------------------------------------------------------------
# تست‌ها (Testing)
# -----------------------------------------------------------------------------

test: test-backend test-frontend ## اجرای تمام تست‌ها (بک‌اند داخل داکر + فرانت‌اند)

test-backend: ## اجرای تست‌های بک‌اند (Pytest) داخل داکر
	$(DOCKER_COMPOSE) run --rm backend pytest

test-backend-local: ## اجرای تست‌های بک‌اند به صورت محلی با Pytest
	pytest backend/tests

test-frontend: ## اجرای تست‌های فرانت‌اند با Vitest
	$(NPM) test --prefix frontend

# -----------------------------------------------------------------------------
# توسعه محلی فرانت‌اند (Frontend Local Development)
# -----------------------------------------------------------------------------

frontend-install: ## نصب وابستگی‌های پکیج فرانت‌اند
	$(NPM) install --prefix frontend

frontend-dev: ## اجرای سرور توسعه Vite فرانت‌اند به صورت لوکال
	$(NPM) run dev --prefix frontend

frontend-build: ## بررسی تایپ‌ها و کامپایل نسخه پروداکشن فرانت‌اند
	$(NPM) run build --prefix frontend

# -----------------------------------------------------------------------------
# توسعه محلی بک‌اند (Backend Local Development)
# -----------------------------------------------------------------------------

backend-install: ## نصب وابستگی‌های پایتون بک‌اند به صورت لوکال
	$(PYTHON) -m pip install -r backend/requirements.txt

backend-dev: ## اجرای سرور توسعه FastAPI به صورت لوکال با قابلیت Reload
	uvicorn app.main:app --app-dir backend --reload --port 8000

# -----------------------------------------------------------------------------
# پردازش دسته‌ای و ارزیابی (CLI & Batch Evaluation)
# -----------------------------------------------------------------------------

analyze: ## اجرای تحلیل دسته‌ای CLI روی داده نمونه و تولید خروجی JSON
	$(DOCKER_COMPOSE) run --rm backend python -m app.cli analyze \
		--input /data/messages_sample.csv \
		--output /data/analysis_sample.json \
		--now 2026-10-26T10:30:00Z

eval-cli: ## اجرای ارزیابی CLI روی eval_messages.csv در زمان مرجع
	$(DOCKER_COMPOSE) run --rm backend python -m app.cli analyze \
		--input /data/eval_messages.csv \
		--output /data/eval_output.json \
		--now 2026-04-15T07:00:00Z

generate-predictions: ## تولید مجدد فایل predictions.csv بر اساس eval_messages.csv
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
# پاک‌سازی (Cleanup)
# -----------------------------------------------------------------------------

clean: ## حذف فایل‌های کش پایتون، پوشه‌های بیلد و فایل‌های موقت
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	rm -rf frontend/dist frontend/.vite
	@echo "کش‌ها و خروجی‌های بیلد پاک‌سازی شدند."
