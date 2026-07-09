import { FastifyInstance } from "fastify";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { optionalDateField, optionalMoneyField, parseDate } from "../lib/validation.js";
import { requireAuth, requireTenantMember } from "../lib/requireAuth.js";
import { resolveTenant, TenantNotFoundError } from "../lib/tenant.js";
import { buildFitGraph, getOrdersWithFitRisk, getFitSummaries } from "../lib/fit-graph.js";
import { getStudioInsights } from "../lib/studio-analytics.js";

const createOrderSchema = z.object({
  clientId: z.string().cuid(),
  garmentType: z.string().min(1).max(200),
  fabric: z.string().max(200).optional(),
  styleNotes: z.string().max(5000).optional(),
  price: optionalMoneyField,
  deposit: optionalMoneyField,
  orderDate: optionalDateField,
  dueDate: optionalDateField,
  collectionDate: optionalDateField,
});

const updateOrderSchema = z.object({
  orderDate: optionalDateField,
  collectionDate: optionalDateField.nullable(),
  dueDate: optionalDateField.nullable(),
});

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function validateScheduleDates(
  orderDate: Date,
  dueDate: Date | null | undefined,
  collectionDate: Date | null | undefined,
): string | null {
  if (dueDate && dateOnly(dueDate) < dateOnly(orderDate)) {
    return "Completion date cannot be before the order date.";
  }
  if (collectionDate && dateOnly(collectionDate) < dateOnly(orderDate)) {
    return "Pickup date cannot be before the order date.";
  }
  if (dueDate && collectionDate && dateOnly(collectionDate) < dateOnly(dueDate)) {
    return "Pickup date cannot be before workshop completion.";
  }
  return null;
}

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(1000).optional(),
});

const measurementDataSchema = z.record(z.union([z.number(), z.string()]));

const createFittingRoundSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  measurements: measurementDataSchema,
  alterations: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
});

const orderOutcomeSchema = z.object({
  fitSuccess: z.boolean(),
  remakeRequired: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

async function nextOrderNumber(tenantId: string): Promise<string> {
  const count = await prisma.order.count({ where: { tenantId } });
  const year = new Date().getFullYear();
  return `VYN-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function orderRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    try {
      const tenant = await resolveTenant(request);
      if (!tenant) {
        return reply.status(400).send({
          error: "Missing X-Tenant-Slug header",
        });
      }
      request.tenant = tenant;
    } catch (err) {
      if (err instanceof TenantNotFoundError) {
        return reply.status(404).send({ error: err.message });
      }
      throw err;
    }
  });
  app.addHook("preHandler", requireAuth);
  app.addHook("preHandler", requireTenantMember);

  app.get("/", async (request) => {
    const tenant = request.tenant!;
    const status = (request.query as { status?: OrderStatus }).status;

    return prisma.order.findMany({
      where: {
        tenantId: tenant.id,
        ...(status ? { status } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { orderNumber: "desc" }],
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  });

  app.post("/", async (request, reply) => {
    const tenant = request.tenant!;
    const body = createOrderSchema.parse(request.body);

    const client = await prisma.client.findFirst({
      where: { id: body.clientId, tenantId: tenant.id },
    });

    if (!client) {
      return reply.status(404).send({ error: "Client not found" });
    }

    const orderNumber = await nextOrderNumber(tenant.id);
    const orderDate = body.orderDate ? parseDate(body.orderDate) : new Date();
    const dueDate = body.dueDate ? parseDate(body.dueDate) : null;
    const collectionDate = body.collectionDate ? parseDate(body.collectionDate) : null;

    const scheduleError = validateScheduleDates(orderDate, dueDate, collectionDate);
    if (scheduleError) {
      return reply.status(400).send({ error: scheduleError });
    }

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          tenantId: tenant.id,
          clientId: body.clientId,
          orderNumber,
          garmentType: body.garmentType,
          fabric: body.fabric,
          styleNotes: body.styleNotes,
          price: body.price,
          deposit: body.deposit,
          createdAt: orderDate,
          dueDate: dueDate ?? undefined,
          collectionDate: collectionDate ?? undefined,
          status: "NEW",
        },
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: created.id,
          status: "NEW",
          note: "Order created",
        },
      });

      return created;
    });

    return reply.status(201).send(order);
  });

  app.get("/fit-risks", async (request) => {
    const tenant = request.tenant!;
    return getOrdersWithFitRisk(tenant.id);
  });

  app.get("/fit-summaries", async (request) => {
    const tenant = request.tenant!;
    return getFitSummaries(tenant.id);
  });

  app.get("/studio-insights", async (request) => {
    const tenant = request.tenant!;
    return getStudioInsights(tenant.id);
  });

  app.patch("/:id", async (request, reply) => {
    const tenant = request.tenant!;
    const { id } = request.params as { id: string };
    const body = updateOrderSchema.parse(request.body);

    const existing = await prisma.order.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existing) {
      return reply.status(404).send({ error: "Order not found" });
    }

    const nextOrderDate =
      body.orderDate !== undefined ? parseDate(body.orderDate) : existing.createdAt;
    const nextDueDate =
      body.dueDate !== undefined
        ? body.dueDate
          ? parseDate(body.dueDate)
          : null
        : existing.dueDate;
    const nextCollectionDate =
      body.collectionDate !== undefined
        ? body.collectionDate
          ? parseDate(body.collectionDate)
          : null
        : existing.collectionDate;

    const scheduleError = validateScheduleDates(
      nextOrderDate,
      nextDueDate,
      nextCollectionDate,
    );
    if (scheduleError) {
      return reply.status(400).send({ error: scheduleError });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(body.orderDate !== undefined ? { createdAt: nextOrderDate } : {}),
        ...(body.dueDate !== undefined ? { dueDate: nextDueDate } : {}),
        ...(body.collectionDate !== undefined ? { collectionDate: nextCollectionDate } : {}),
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return order;
  });

  app.patch("/:id/status", async (request, reply) => {
    const tenant = request.tenant!;
    const { id } = request.params as { id: string };
    const body = updateStatusSchema.parse(request.body);

    const existing = await prisma.order.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existing) {
      return reply.status(404).send({ error: "Order not found" });
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: { status: body.status },
        include: {
          client: { select: { id: true, firstName: true, lastName: true } },
          statusHistory: { orderBy: { createdAt: "desc" }, take: 5 },
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: body.status,
          note: body.note,
        },
      });

      return updated;
    });

    return order;
  });

  app.get("/:id/fit-graph", async (request, reply) => {
    const tenant = request.tenant!;
    const { id } = request.params as { id: string };
    const graph = await buildFitGraph(id, tenant.id);
    if (!graph) {
      return reply.status(404).send({ error: "Order not found" });
    }
    return graph;
  });

  app.post("/:id/fitting-rounds", async (request, reply) => {
    const tenant = request.tenant!;
    const { id } = request.params as { id: string };
    const body = createFittingRoundSchema.parse(request.body);

    const order = await prisma.order.findFirst({
      where: { id, tenantId: tenant.id },
      include: { fittingRounds: { orderBy: { roundNumber: "desc" }, take: 1 } },
    });

    if (!order) {
      return reply.status(404).send({ error: "Order not found" });
    }

    const nextRound = (order.fittingRounds[0]?.roundNumber ?? 0) + 1;

    const round = await prisma.fittingRound.create({
      data: {
        tenantId: tenant.id,
        orderId: id,
        roundNumber: nextRound,
        label: body.label ?? `Fitting ${nextRound}`,
        measurements: body.measurements,
        alterations: body.alterations,
        notes: body.notes,
      },
    });

    const graph = await buildFitGraph(id, tenant.id);
    return reply.status(201).send({ round, graph });
  });

  app.put("/:id/outcome", async (request, reply) => {
    const tenant = request.tenant!;
    const { id } = request.params as { id: string };
    const body = orderOutcomeSchema.parse(request.body);

    const order = await prisma.order.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!order) {
      return reply.status(404).send({ error: "Order not found" });
    }

    const outcome = await prisma.orderOutcome.upsert({
      where: { orderId: id },
      create: {
        orderId: id,
        fitSuccess: body.fitSuccess,
        remakeRequired: body.remakeRequired ?? false,
        notes: body.notes,
      },
      update: {
        fitSuccess: body.fitSuccess,
        remakeRequired: body.remakeRequired ?? false,
        notes: body.notes,
        recordedAt: new Date(),
      },
    });

    const graph = await buildFitGraph(id, tenant.id);
    return { outcome, graph };
  });
}
