import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  publicUser,
  signAccessToken,
  verifyPassword,
  type AuthUser,
} from "../lib/auth.js";
import { requireAuth } from "../lib/requireAuth.js";

const loginSchema = z.object({
  tenantSlug: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  /** Studio staff login — returns JWT for Authorization header. */
  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);

    const tenant = await prisma.tenant.findUnique({
      where: { slug: body.tenantSlug },
    });
    if (!tenant) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: body.email.toLowerCase(),
        },
      },
    });

    if (!user) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const authUser: AuthUser = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = await signAccessToken(authUser);

    return {
      token,
      user: publicUser(authUser),
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
    };
  });

  /** Current user from Bearer token. */
  app.get("/me", { preHandler: requireAuth }, async (request) => {
    const user = request.user!;
    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, slug: true, name: true },
    });

    return {
      user: publicUser(user),
      tenant,
    };
  });
}
