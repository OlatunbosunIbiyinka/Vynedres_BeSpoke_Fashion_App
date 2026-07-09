# Changelog

All notable changes to VYNEDRES Atelier.

## [0.1.0] - 2026-07-01

### Added

- **VYNEDRES Atelier** — new multi-tenant bespoke fashion SaaS platform
- `apps/api` — Fastify + TypeScript + Prisma REST API
- `apps/web` — Next.js studio dashboard and client portal
- `infra/terraform` — modular Azure PaaS (Container Apps, PostgreSQL, Storage, Key Vault)
- Multi-tenant data model: Tenant, User, Client, MeasurementProfile, Order
- Docker Compose for local PostgreSQL
- CI workflow: API lint, web build, Terraform validate
- Documentation: ARCHITECTURE.md, GETTING_STARTED.md

### Removed

- Legacy nimbuscompute VM infrastructure (replaced by VYNEDRES platform)
