import { FastifyInstance } from "fastify";
import { z } from "zod";
import { hashPassword } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

const createTenantSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  name: z.string().min(2).max(100),
  currency: z.string().length(3).default("GBP"),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(2).max(100),
  ownerPassword: z.string().min(8).max(100),
});

export async function tenantRoutes(app: FastifyInstance) {
  /** Public: register a new studio with an owner account. */
  app.post("/", async (request, reply) => {
    const body = createTenantSchema.parse(request.body);

    const existing = await prisma.tenant.findUnique({ where: { slug: body.slug } });
    if (existing) {
      return reply.status(409).send({ error: "Studio slug already taken" });
    }

    const passwordHash = await hashPassword(body.ownerPassword);

    const tenant = await prisma.tenant.create({
      data: {
        slug: body.slug,
        name: body.name,
        currency: body.currency,
        users: {
          create: {
            email: body.ownerEmail.toLowerCase(),
            name: body.ownerName,
            passwordHash,
            role: "OWNER",
          },
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        currency: true,
        createdAt: true,
      },
    });

    return reply.status(201).send(tenant);
  });

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
        createdAt: true,
      },
    });

    if (!tenant) {
      return reply.status(404).send({ error: "Studio not found" });
    }

    return tenant;
  });
}
