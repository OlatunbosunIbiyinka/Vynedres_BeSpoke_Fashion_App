import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { findValidPortalAccess } from "../lib/portal-access.js";
import {
  portalMeasurementSchema,
  portalSessionSchema,
  validateMeasurementData,
} from "../lib/portal-measurements.js";

const ACTIVE_ORDER_STATUSES = ["NEW", "IN_PROGRESS", "FITTING"] as const;

/**
 * Client portal — public studio profile; order access requires an invite token.
 */
export async function portalRoutes(app: FastifyInstance) {
  app.get("/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        currency: true,
      },
    });

    if (!tenant) {
      return reply.status(404).send({ error: "Studio not found" });
    }

    return { tenant };
  });

  app.post("/:slug/session", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const body = portalSessionSchema.parse(request.body);

    const access = await findValidPortalAccess(slug, body.token);
    if (!access) {
      return reply.status(401).send({
        error:
          "This portal link is invalid or has expired. Ask your studio for a new invite.",
      });
    }

    const { tenant, client } = access;

    const orders = await prisma.order.findMany({
      where: {
        tenantId: tenant.id,
        clientId: client.id,
        status: { not: "CANCELLED" },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        garmentType: true,
        fabric: true,
        status: true,
        createdAt: true,
        dueDate: true,
        collectionDate: true,
        measurementProfiles: { select: { id: true }, take: 1 },
      },
    });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      client: {
        firstName: client.firstName,
        lastName: client.lastName,
      },
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        garmentType: order.garmentType,
        fabric: order.fabric,
        status: order.status,
        createdAt: order.createdAt,
        dueDate: order.dueDate,
        collectionDate: order.collectionDate,
        hasMeasurements: order.measurementProfiles.length > 0,
        canSubmitMeasurements: ACTIVE_ORDER_STATUSES.includes(
          order.status as (typeof ACTIVE_ORDER_STATUSES)[number],
        ),
      })),
    };
  });

  app.post("/:slug/measurements", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const body = portalMeasurementSchema.parse(request.body);

    const access = await findValidPortalAccess(slug, body.token);
    if (!access) {
      return reply.status(401).send({
        error:
          "This portal link is invalid or has expired. Ask your studio for a new invite.",
      });
    }

    const { tenant, client } = access;

    const validated = validateMeasurementData(body.data);
    if (!validated.ok) {
      return reply.status(400).send({ error: validated.error });
    }

    if (body.orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: body.orderId,
          tenantId: tenant.id,
          clientId: client.id,
          status: { not: "CANCELLED" },
        },
      });

      if (!order) {
        return reply.status(404).send({ error: "Order not found" });
      }

      if (
        !ACTIVE_ORDER_STATUSES.includes(
          order.status as (typeof ACTIVE_ORDER_STATUSES)[number],
        )
      ) {
        return reply.status(400).send({
          error:
            "Measurements can only be submitted for active orders before delivery.",
        });
      }
    }

    const label =
      body.label?.trim() ||
      (body.orderId
        ? "Client self-measurement (portal)"
        : "Client profile (portal)");

    const profile = await prisma.measurementProfile.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        orderId: body.orderId,
        label,
        source: "PORTAL",
        data: validated.data,
      },
    });

    return reply.status(201).send({
      message:
        "Measurements submitted — your studio will review them before your fitting.",
      profile: {
        id: profile.id,
        label: profile.label,
        createdAt: profile.createdAt,
      },
    });
  });

  /** @deprecated Email-only lookup removed — use invite token via POST /session */
  app.post("/:slug/lookup", async (_request, reply) => {
    return reply.status(410).send({
      error:
        "Email-only portal access has been removed. Open the invite link from your studio.",
    });
  });

  /** @deprecated Use invite token session — kept for backwards-compatible empty response */
  app.get("/:slug/orders", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        logoUrl: true,
        currency: true,
      },
    });

    if (!tenant) {
      return reply.status(404).send({ error: "Studio not found" });
    }

    return {
      tenant,
      orders: [],
      hint: "Open your invite link (POST /api/v1/portal/:slug/session with token) to view orders.",
    };
  });
}
