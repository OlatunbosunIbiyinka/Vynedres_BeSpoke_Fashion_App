import { FastifyRequest } from "fastify";
import { prisma } from "./prisma.js";

export class TenantNotFoundError extends Error {
  constructor(slug: string) {
    super(`Studio not found: ${slug}`);
    this.name = "TenantNotFoundError";
  }
}

/**
 * Resolves the tenant (studio) from the X-Tenant-Slug header.
 * In production, this can also resolve from subdomain: amara.vynedres.com
 */
export async function resolveTenant(request: FastifyRequest) {
  const slug = request.headers["x-tenant-slug"];

  if (!slug || typeof slug !== "string") {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    throw new TenantNotFoundError(slug);
  }

  return tenant;
}

export function requireTenant<T extends { tenantId?: string }>(
  tenantId: string,
  record: T,
): asserts record is T & { tenantId: string } {
  if (record.tenantId !== tenantId) {
    throw new Error("Resource does not belong to this studio");
  }
}
