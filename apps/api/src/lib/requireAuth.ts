import type { FastifyReply, FastifyRequest } from "fastify";
import { verifyAccessToken, type AuthUser } from "./auth.js";

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

function extractBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

/** Attach request.user from Authorization: Bearer <jwt>. */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = extractBearerToken(request);
  if (!token) {
    reply.status(401).send({
      error: "Authentication required",
      hint: "Send Authorization: Bearer <token> from POST /api/v1/auth/login",
    });
    return;
  }

  try {
    const payload = await verifyAccessToken(token);
    const user: AuthUser = {
      id: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    request.user = user;
  } catch {
    reply.status(401).send({ error: "Invalid or expired token" });
  }
}

/** User must belong to the resolved tenant (studio isolation). */
export async function requireTenantMember(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!request.user) {
    reply.status(401).send({ error: "Authentication required" });
    return;
  }
  if (!request.tenant) {
    reply.status(400).send({ error: "Missing tenant context" });
    return;
  }
  if (request.user.tenantId !== request.tenant.id) {
    reply.status(403).send({
      error: "You do not have access to this studio",
    });
  }
}
