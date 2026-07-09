# VYNEDRES Atelier

[![CI](https://github.com/your-username/vynedres/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/vynedres/actions/workflows/ci.yml)

**Bespoke fashion platform for independent tailors and small fashion houses.**

VYNEDRES Atelier is a multi-tenant SaaS that lets studios manage clients, measurements, and bespoke orders — with a branded client portal. Built on Azure PaaS (Container Apps, PostgreSQL) without Kubernetes.

---

## What you're building

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Web** | Next.js 15, TypeScript, Tailwind | Studio dashboard + client portal |
| **API** | Fastify, Prisma, PostgreSQL | Multi-tenant REST API |
| **Local DB** | Docker Compose | Development PostgreSQL |
| **Cloud** | Terraform + Azure Container Apps | Production infrastructure |

---

## Quick start

```bash
# 1. Database
docker compose up -d

# 2. API
cd apps/api && cp .env.example .env && npm install
npx prisma migrate dev --name init && npm run db:seed && npm run dev

# 3. Web (new terminal)
cd apps/web && cp .env.example .env.local && npm install && npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/studio/vynedres | Studio dashboard (demo) |
| http://localhost:3000/portal/vynedres | Client portal (demo) |
| http://localhost:3001/health | API health check |

Full guide: **[docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)**

---

## Project structure

```
vynedres/
├── apps/
│   ├── api/                 # Fastify REST API + Prisma
│   │   ├── prisma/          # Database schema & migrations
│   │   └── src/
│   │       ├── routes/      # API endpoints
│   │       └── lib/         # Prisma client, tenant resolution
│   └── web/                 # Next.js frontend
│       └── src/app/
│           ├── studio/[slug]   # Tailor dashboard
│           └── portal/[slug]   # Client portal
├── infra/terraform/
│   ├── modules/             # Reusable Azure modules
│   └── environments/dev/    # Dev environment wiring
├── docs/
│   ├── ARCHITECTURE.md      # System design (read this!)
│   └── GETTING_STARTED.md   # Setup instructions
└── docker-compose.yml       # Local PostgreSQL
```

---

## Phase 1 features (current)

- Multi-tenant studio registration
- Client CRM with measurement profiles (JSON)
- Bespoke order creation and pipeline status
- Studio dashboard (clients + orders)
- Client portal (order visibility)
- Azure infrastructure as code (Container Apps, PostgreSQL, Storage, Key Vault)

## Roadmap

- [x] Authentication (studio JWT login — Phase 1.1)
- [x] Measurement profiles in studio dashboard (view + add)
- [ ] Measurement submission wizard (client portal)
- [ ] Stripe subscriptions (Solo / Studio plans)
- [ ] File uploads (Blob Storage)
- [ ] WhatsApp notifications
- [ ] AI fit assist & virtual try-on (Phase 3)

---

## Learn from this repo

1. **Multi-tenancy** — `apps/api/prisma/schema.prisma` + `src/lib/tenant.ts`
2. **API design** — `apps/api/src/routes/`
3. **Full-stack flow** — `apps/web/src/app/studio/[slug]/page.tsx` → API → DB
4. **IaC on Azure PaaS** — `infra/terraform/environments/dev/main.tf`
5. **Why not Kubernetes** — see `docs/ARCHITECTURE.md`

---

## Author

**Olatunbosun Ibiyinka**

---

## License

MIT — see [LICENSE](LICENSE)
