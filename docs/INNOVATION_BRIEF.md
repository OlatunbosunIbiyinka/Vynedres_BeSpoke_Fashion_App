# VYNEDRES Atelier — Innovation Brief

**Document purpose:** Innovator Founder visa endorsement (UK)  
**Company:** VYNEDRES Atelier (pre-trading)  
**Version:** 1.0 — July 2026  
**Contact:** [Founder name / email]

---

## 1. Executive summary

VYNEDRES Atelier is a **multi-tenant SaaS platform for independent tailors and small fashion houses** specialising in **bespoke (made-to-measure) garments**. Unlike generic fashion retail or appointment-booking tools, VYNEDRES addresses a specific operational gap: **there is no system that links a client's measurements, each in-person fitting, alterations, and final delivery outcome into one longitudinal fit record**.

Our innovation comprises three integrated capabilities:

1. **Fit Graph™** — a structured data model connecting baseline measurements → fitting rounds → delivery outcome per order  
2. **Fitting Delta Engine** — rule-based comparison of measurement snapshots between fittings, flagging anomalies before the next cut  
3. **Atelier Operational AI** — a studio assistant that answers operational questions (processing time, delay risk, fit risk) using **live database metrics only** — never invented statistics

A working MVP is built and demonstrable locally. The business is **pre-trading** and seeking endorsement to launch a UK pilot with independent ateliers.

---

## 2. The problem

Bespoke tailoring is a **high-touch, high-risk manufacturing process**:

- A single garment may require **multiple fittings** over weeks  
- Measurements **change** between sessions (client weight, posture, undergarments, tailor interpretation)  
- A mistake at fitting two can mean **expensive rework or client dissatisfaction**  
- Small studios (1–15 people) rely on **paper notes, WhatsApp, and memory** — no structured link between "what we measured" and "whether the final garment fit"

Existing software partially addresses pieces of this puzzle:

| Category | Examples | Gap |
|----------|----------|-----|
| Bespoke order management | Tayloz, MTMPRO, Bespokible | Order/status tracking; limited longitudinal fit intelligence |
| 3D body scanning | 3DLOOK, similar | Body capture at a point in time; not linked to fitting outcomes across a bespoke pipeline |
| Generic CRM / booking | Calendly, spreadsheets | No measurement delta logic or fit-confidence scoring |

**No product identified combines** a per-order fit journey (baseline → fittings → outcome), pre-cut anomaly detection, and operational analytics grounded in that journey — in one multi-tenant atelier platform.

---

## 3. Our innovation

### 3.1 Fit Graph™

A **Fit Graph** is the longitudinal record for one bespoke order:

```
Client baseline (studio or portal)
        ↓
Fitting round 1 (measurements + alterations noted)
        ↓
Fitting round 2 … n
        ↓
Delivery outcome (fit success / remake required)
```

**Why this is innovative:** Fit is treated as a **time-series problem**, not a static measurement form. Each node is a dated snapshot. The graph closes the loop when delivery outcome is recorded — creating a structured dataset that can later support studio benchmarks (e.g. remake rates by alteration pattern). The MVP stores and surfaces that loop; it does **not** yet run machine learning on outcomes.

**Implemented in MVP:** PostgreSQL schema (`FittingRound`, `OrderOutcome`, `MeasurementProfile` with optional `orderId`); studio UI with expandable Fit Graph per order; client portal wizard for at-home baseline submission (invite-token access).

### 3.2 Fitting Delta Engine

Between any two snapshots (baseline → fitting, or fitting → fitting), the engine:

- Computes **field-level deltas** (chest, waist, hips, shoulder, sleeve, inseam) in centimetres  
- Applies **fixed, field-level thresholds** (e.g. waist ±3 cm triggers review; larger shifts escalate severity) — deterministic and auditable; garment-type-specific thresholds are a planned refinement  
- Produces a **heuristic fit confidence score** (0–100%) from alert count, fitting coverage, and delivery outcome (not a calibrated statistical model)

**Why this is innovative:** This is **decision support before the next cut**, not post-hoc reporting. Alerts are rule-based and explainable — suitable for professional tailoring where trust matters more than black-box scoring.

**Implemented in MVP:** `fitting-delta.ts`, `fit-graph.ts`; alerts surfaced in studio UI and via assistant "fit risk" queries.

### 3.3 Atelier Operational AI

A **rule-based assistant** (with optional OpenAI routing for phrasing only) answers:

- Average order processing time (order date → delivered)  
- Orders likely delayed (vs deadlines and historical average)  
- Orders with fit risk (low confidence / measurement anomalies)  
- Pipeline summary by status  

**Critical design principle:** All numbers are computed from **tenant-scoped database queries**. The model does not invent metrics. This pattern mirrors production "tool use" AI architectures and is appropriate for regulated, trust-sensitive professional workflows.

**Implemented in MVP:** `analytics.ts`, `assistant.ts`, Studio Assistant chat UI.

---

## 4. Technical architecture (summary)

| Layer | Technology |
|-------|------------|
| Web | Next.js 15, TypeScript, Tailwind — studio dashboard + client portal |
| API | Fastify, Prisma, PostgreSQL — multi-tenant REST API |
| Isolation | `tenantId` on all business data; JWT auth for studio; invite-token access for portal |
| Deploy target | Azure Container Apps, managed PostgreSQL, Blob Storage (Terraform modules prepared) |

**Demonstrable today:**

- Studio: http://localhost:3000/studio/vynedres  
- Portal: http://localhost:3000/portal/vynedres  
- Full stack via Docker Compose (`docker-compose.stack.yml`)

---

## 5. Competitive differentiation

| Dimension | Typical bespoke software | VYNEDRES Atelier |
|-----------|-------------------------|------------------|
| Measurement storage | Static profile per client | **Per-order Fit Graph** with linked portal baseline |
| Between fittings | Manual comparison | **Automated delta alerts** with severity |
| Outcome tracking | Order marked "delivered" | **Structured outcome** (fit success, remake flag) closes the graph |
| Analytics | Generic reports | **Operational AI** on processing time, delay risk, fit risk |
| Client involvement | In-studio only | **Portal measurement wizard** feeds studio baseline |

**Defensibility:** Data network effects — as a studio records more Fit Graphs, benchmarks improve (processing time, alert patterns, outcome rates). The combination of graph structure + delta engine + grounded assistant is the IP surface, not a generic UI.

---

## 6. Market opportunity

**Target customers (Phase 1):**

- Independent tailors (1–5 staff)  
- Small fashion houses (3–15 staff)  
- UK initial focus; global SaaS model  

**UK bespoke and made-to-measure market** is fragmented — thousands of small studios with low software adoption and high reliance on informal tools. Willingness to pay for reduced remake risk and client professionalism is evidenced by existing niche tools (often £30–150/month range).

**Planned monetisation (post-endorsement):**

- Solo plan: ~£29–49/month  
- Studio plan: ~£79–149/month  
- Optional commission on platform payments (future)  

**Business status:** Pre-trading. No customer revenue. MVP and pilot discussions only.

---

## 7. Traction and evidence

| Item | Status |
|------|--------|
| Working MVP (studio + portal + Fit Graph) | ✅ Complete |
| Demo tenant with sample order, fittings, outcome | ✅ Seeded |
| Client portal measurement submission (invite token) | ✅ Live |
| API unit tests (delta + validation + portal access) | ✅ Passing |
| Azure infrastructure (Terraform) | 🔧 Scaffolded, not deployed |
| Paying customers | ❌ None (by design — pre-trading) |
| Pilot LOI from UK atelier | 🔲 Target — next 4–8 weeks |

**Recommended demo flow for endorsers:**

1. Studio issues a portal invite for the demo client (or use the seeded invite link)  
2. Client opens the invite link and submits measurements  
3. Studio shows **Client portal** badge on Fit Graph baseline  
4. Fitting rounds show **delta alerts** (e.g. waist +3 cm)  
5. Assistant answers: *"Which orders have fit risk?"*  
6. Delivery outcome closes graph; fit confidence updates  

---

## 8. Roadmap (12 months post-endorsement)

| Quarter | Milestone |
|---------|-----------|
| Q1 | Endorsement → Azure deploy → 1 UK pilot studio onboarded |
| Q2 | Pilot feedback → fitting photo uploads → notification emails |
| Q3 | 3–5 studios; anonymised fit-outcome dataset for case studies |
| Q4 | Commercial launch (Stripe); Studio plan; endorser progress report |

**Jobs created:** Founder initially; first hire (customer success / technical support) targeted at 5+ paying studios.

---

## 9. Why the UK

- Concentration of **bespoke tailoring heritage** (Savile Row ecosystem, independent ateliers nationwide)  
- Strong **digital adoption** among younger tailor entrepreneurs  
- **Innovator Founder route** aligns with pre-trading, high-growth-intent SaaS  
- Founder [intends to base / is based in UK — *customise*]

---

## 10. Request

We seek Innovator Founder endorsement on the basis that VYNEDRES Atelier is a **genuine innovation** in bespoke fashion operations — not a generic e-commerce or fashion marketplace — with a **working technical MVP**, clear **scalable SaaS model**, and a credible path to **UK pilot and commercialisation**.

**Supporting materials available on request:**

- Live product demonstration  
- Architecture overview (`docs/ARCHITECTURE.md`)  
- Repository access (private)  
- Pilot LOI (in progress)

---

*VYNEDRES Atelier — precision fit intelligence for the modern atelier.*
