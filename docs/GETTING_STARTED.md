# Getting Started — VYNEDRES Atelier

## Prerequisites

- **Node.js** 20+
- **Docker Desktop** (for local PostgreSQL)
- **Terraform** 1.6+ (only for Azure deployment)

## 1. Start the database

```bash
docker compose up -d
```

Wait until PostgreSQL is healthy:

```bash
docker compose ps
```

## 2. Set up the API

```bash
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

API runs at **http://localhost:3001**

Test it:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/v1/tenants/vynedres
curl -H "X-Tenant-Slug: vynedres" http://localhost:3001/api/v1/clients
```

## 3. Set up the web app

In a new terminal:

```bash
cd apps/web
cp .env.example .env.local
npm install
npm run dev
```

Web runs at **http://localhost:3000**

Open:
- **Home:** http://localhost:3000
- **Studio dashboard:** http://localhost:3000/studio/vynedres
- **Client portal (invite link):** http://localhost:3000/portal/vynedres?token=demo-portal-amara-2026

Studio login (seeded): `studio@vynedres.com` / `studio123`

Portal access requires an invite token (created in Studio → Clients → Portal invite). Email-only lookup is disabled.

## 4. Study path (recommended order)

1. Read `docs/ARCHITECTURE.md`
2. Explore `prisma/schema.prisma` — understand tenants and relationships
3. Trace a request: `studio/[slug]/page.tsx` → `lib/api.ts` → API route → Prisma
4. Create a client via API:

```bash
curl -X POST http://localhost:3001/api/v1/clients \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Slug: vynedres" \
  -d '{"firstName":"Test","lastName":"Client","email":"test@example.com"}'
```

5. When ready for cloud: `infra/terraform/environments/dev`

## Azure deployment (overview)

```bash
cd infra/terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — never commit this file
az login
terraform init
terraform plan
terraform apply
```

After building Docker images, push to Azure Container Registry and update `api_container_image` / `web_container_image` in `terraform.tfvars`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API can't connect to DB | Ensure `docker compose up -d` and `DATABASE_URL` in `.env` |
| Web shows empty data | Run `npm run db:seed` in `apps/api` |
| Port in use | Change `PORT` in API `.env` or web dev port |
