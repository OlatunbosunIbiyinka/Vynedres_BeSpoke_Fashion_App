.PHONY: help up down db-migrate db-seed api-dev web-dev install stack-up stack-down stack-build test-api

help: ## Show available commands
	@echo VYNEDRES Atelier - development commands
	@echo.
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

up: ## Start local PostgreSQL
	docker compose up -d

down: ## Stop local PostgreSQL
	docker compose down

stack-build: ## Build API + web container images
	docker compose -f docker-compose.stack.yml build

stack-up: ## Run full stack (postgres + api + web) in Docker
	docker compose -f docker-compose.stack.yml up -d --build

stack-down: ## Stop full Docker stack
	docker compose -f docker-compose.stack.yml down

test-api: ## Run API unit tests
	cd apps/api && npm test

install: ## Install all app dependencies
	cd apps/api && npm install
	cd apps/web && npm install

db-migrate: ## Run Prisma migrations (API)
	cd apps/api && cp -n .env.example .env 2>/dev/null || true && npm run db:migrate

db-seed: ## Seed demo data (studio slug: vynedres)
	cd apps/api && npm run db:seed

api-dev: ## Start API dev server (port 3001)
	cd apps/api && npm run dev

web-dev: ## Start web dev server (port 3000)
	cd apps/web && npm run dev

tf-init: ## Initialize Terraform (dev environment)
	cd infra/terraform/environments/dev && terraform init

tf-plan: ## Plan Azure infrastructure (dev)
	cd infra/terraform/environments/dev && terraform plan

tf-validate: ## Validate Terraform
	cd infra/terraform/environments/dev && terraform init -backend=false && terraform validate
