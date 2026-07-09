# VYNEDRES Atelier — Architecture

## What this system is

**VYNEDRES Atelier** is a multi-tenant SaaS platform for independent tailors and small fashion houses. Each tailor is a **Tenant** (studio). All data is isolated by `tenantId`.

```
┌─────────────────────────────────────────────────────────────────┐
│                         VYNEDRES Platform                        │
├─────────────────────────────────────────────────────────────────┤
│  apps/web (Next.js)          apps/api (Fastify + Prisma)         │
│  - Marketing landing         - REST API v1                       │
│  - Studio dashboard          - Multi-tenant middleware           │
│  - Client portal             - PostgreSQL data access            │
├─────────────────────────────────────────────────────────────────┤
│  docker-compose (local)      infra/terraform (Azure)             │
│  - PostgreSQL 16             - Container Apps Environment        │
│                              - PostgreSQL Flexible Server        │
│                              - Blob Storage, Key Vault, Logs       │
└─────────────────────────────────────────────────────────────────┘
```

## Multi-tenancy model

| Concept | Implementation |
|---------|----------------|
| Studio | `Tenant` row with unique `slug` |
| Isolation | Every `Client`, `Order`, `MeasurementProfile` has `tenantId` |
| API scoping | `X-Tenant-Slug` header on protected routes |
| Future | Subdomain routing: `amara.vynedres.com` → tenant `amara` |

**Why this matters:** In SaaS, one database serves many customers. `tenantId` on every query prevents Studio A from seeing Studio B's clients.

## Data model (Phase 1)

```
Tenant
 ├── User (OWNER | STAFF)
 ├── Client
 │    └── MeasurementProfile (JSON measurements)
 └── Order
      └── OrderStatusHistory
```

### Order pipeline

`NEW` → `IN_PROGRESS` → `FITTING` → `READY` → `DELIVERED`

## API design

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness |
| POST | `/api/v1/tenants` | Register studio |
| GET | `/api/v1/tenants/:slug` | Public studio profile |
| GET | `/api/v1/clients` | List clients (tenant-scoped) |
| POST | `/api/v1/clients` | Create client |
| GET | `/api/v1/clients/:id` | Client detail + measurements |
| POST | `/api/v1/clients/:id/measurements` | Add measurement profile |
| GET | `/api/v1/orders` | List orders |
| POST | `/api/v1/orders` | Create order |
| PATCH | `/api/v1/orders/:id/status` | Move pipeline stage |

## Azure infrastructure (dev)

Terraform modules in `infra/terraform/modules/`:

| Module | Azure resource |
|--------|----------------|
| `resource-group` | Resource group |
| `log-analytics` | Log Analytics workspace |
| `postgresql` | PostgreSQL Flexible Server + database |
| `storage` | Storage account + private uploads container |
| `key-vault` | Key Vault for secrets |
| `container-apps` | Container Apps Environment + API + Web apps |

**No Kubernetes.** Container Apps is managed PaaS — Azure runs the containers, you define the app.

## Local vs cloud

| Layer | Local | Azure |
|-------|-------|-------|
| Database | Docker PostgreSQL | PostgreSQL Flexible Server |
| API | `npm run dev` :3001 | Container App |
| Web | `npm run dev` :3000 | Container App |
| Files | (Phase 1.1) | Blob Storage |

## Security notes (Phase 1)

- **Studio auth:** JWT (`Authorization: Bearer`) after email/password login; routes also require `X-Tenant-Slug` and verify the token’s `tenantId` matches
- **Portal auth:** invite tokens issued by the studio (`PortalAccessToken`). Clients open `/portal/[slug]?token=…` — email-only lookup is **not** sufficient
- Roles (`OWNER` / `STAFF`) are stored but not yet enforced on mutations
- Never commit `.env` or `terraform.tfvars`
- Body measurements are PII — treat `MeasurementProfile.data` as sensitive
- Production still needs: rate limiting, httpOnly cookies (or short-lived portal sessions), Key Vault–injected secrets, and disabled demo seed defaults

## What to study in this repo

1. `apps/api/prisma/schema.prisma` — data modeling
2. `apps/api/src/lib/tenant.ts` — tenant resolution
3. `apps/api/src/routes/*.ts` — API patterns
4. `apps/web/src/app/studio/[slug]/page.tsx` — server component fetching API
5. `infra/terraform/environments/dev/main.tf` — wiring modules together
6. `docker-compose.yml` — local dependencies
