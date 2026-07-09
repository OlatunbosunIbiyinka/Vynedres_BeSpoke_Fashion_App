# Phase 1 Specification — VYNEDRES Atelier

Reference document for what we are building in Phase 1.

## Target customers

- Independent tailors (1–5 people)
- Small fashion houses (3–15 people)

## Product surfaces

| Surface | Route | User |
|---------|-------|------|
| Landing | `/` | Public |
| Studio dashboard | `/studio/[slug]` | Tailor / staff |
| Client portal | `/portal/[slug]` | End customer |

## Core entities

- **Tenant** — a studio (e.g. slug `vynedres`)
- **User** — studio staff (OWNER, STAFF)
- **Client** — tailor's customer
- **MeasurementProfile** — JSON body measurements per client
- **Order** — bespoke garment order with pipeline status
- **OrderStatusHistory** — audit trail of status changes

## Order pipeline

`NEW` → `IN_PROGRESS` → `FITTING` → `READY` → `DELIVERED`

## Explicitly out of scope (Phase 1)

- Public tailor marketplace / discovery
- Stripe payments
- File uploads to Blob Storage
- AI try-on
- Pattern sketcher
- WhatsApp notifications

## Monetization (future)

- Solo plan: ~£29–49/mo
- Studio plan: ~£79–149/mo
- Optional commission on platform payments
