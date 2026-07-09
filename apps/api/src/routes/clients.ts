import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  createPortalInvite,
  listPortalInvites,
  revokePortalInvite,
} from "../lib/portal-access.js";
import { requireAuth, requireTenantMember } from "../lib/requireAuth.js";
import { resolveTenant, TenantNotFoundError } from "../lib/tenant.js";

const createClientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  notes: z.string().max(2000).optional(),
});

const measurementSchema = z.object({
  label: z.string().min(1).max(100).default("Default"),
  data: z.record(z.union([z.number(), z.string()])),
});

const createInviteSchema = z.object({
  expiresInDays: z.number().int().min(1).max(90).optional(),
});

export async function clientRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    try {
      const tenant = await resolveTenant(request);
      if (!tenant) {
        return reply.status(400).send({
          error: "Missing X-Tenant-Slug header",
          hint: "Send the studio slug, e.g. X-Tenant-Slug: vynedres",
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
    return prisma.client.findMany({
      where: { tenantId: tenant.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { orders: true, measurements: true } },
      },
    });
  });

  app.post("/", async (request, reply) => {
    const tenant = request.tenant!;
    const body = createClientSchema.parse(request.body);

    const client = await prisma.client.create({
      data: { ...body, tenantId: tenant.id },
    });

    return reply.status(201).send(client);
  });

  app.get("/:id", async (request, reply) => {
    const tenant = request.tenant!;
    const { id } = request.params as { id: string };

    const client = await prisma.client.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        measurements: { orderBy: { createdAt: "desc" } },
        orders: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!client) {
      return reply.status(404).send({ error: "Client not found" });
    }

    return client;
  });

  app.post("/:id/measurements", async (request, reply) => {
    const tenant = request.tenant!;
    const { id } = request.params as { id: string };
    const body = measurementSchema.parse(request.body);

    const client = await prisma.client.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!client) {
      return reply.status(404).send({ error: "Client not found" });
    }

    const profile = await prisma.measurementProfile.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        label: body.label,
        data: body.data,
      },
    });

    return reply.status(201).send(profile);
  });

  app.post("/:id/portal-invite", async (request, reply) => {
    const tenant = request.tenant!;
    const { id } = request.params as { id: string };
    const body = createInviteSchema.parse(request.body ?? {});

    try {
      const invite = await createPortalInvite({
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        clientId: id,
        expiresInDays: body.expiresInDays,
      });
      return reply.status(201).send(invite);
    } catch (err) {
      if (err instanceof Error && err.message === "Client not found") {
        return reply.status(404).send({ error: "Client not found" });
      }
      throw err;
    }
  });

  app.get("/:id/portal-invites", async (request, reply) => {
    const tenant = request.tenant!;
    const { id } = request.params as { id: string };

    const client = await prisma.client.findFirst({
      where: { id, tenantId: tenant.id },
      select: { id: true },
    });

    if (!client) {
      return reply.status(404).send({ error: "Client not found" });
    }

    const invites = await listPortalInvites(tenant.id, client.id);
    return { invites };
  });

  app.delete("/:id/portal-invites/:inviteId", async (request, reply) => {
    const tenant = request.tenant!;
    const { id, inviteId } = request.params as { id: string; inviteId: string };

    const revoked = await revokePortalInvite(tenant.id, id, inviteId);
    if (!revoked) {
      return reply.status(404).send({ error: "Invite not found" });
    }

    return { ok: true };
  });
}

