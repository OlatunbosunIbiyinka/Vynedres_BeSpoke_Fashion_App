import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma.js";

const DEFAULT_TTL_DAYS = 30;

export function generatePortalToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Store only the hash; the raw token is shown once at invite time. */
export function hashPortalToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function portalTokenExpiresAt(days = DEFAULT_TTL_DAYS): Date {
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + days);
  return expires;
}

export async function createPortalInvite(input: {
  tenantId: string;
  tenantSlug: string;
  clientId: string;
  expiresInDays?: number;
  webOrigin?: string;
}) {
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, tenantId: input.tenantId },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  const rawToken = generatePortalToken();
  const tokenHash = hashPortalToken(rawToken);
  const expiresAt = portalTokenExpiresAt(input.expiresInDays ?? DEFAULT_TTL_DAYS);

  await prisma.portalAccessToken.create({
    data: {
      tenantId: input.tenantId,
      clientId: client.id,
      tokenHash,
      expiresAt,
    },
  });

  const origin = (input.webOrigin ?? process.env.CORS_ORIGIN ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const inviteUrl = `${origin}/portal/${input.tenantSlug}?token=${encodeURIComponent(rawToken)}`;

  return {
    clientId: client.id,
    clientName: `${client.firstName} ${client.lastName}`,
    email: client.email,
    expiresAt: expiresAt.toISOString(),
    inviteUrl,
    token: rawToken,
  };
}

export async function findValidPortalAccess(tenantSlug: string, rawToken: string) {
  const tokenHash = hashPortalToken(rawToken.trim());

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, slug: true, name: true },
  });

  if (!tenant) return null;

  const access = await prisma.portalAccessToken.findFirst({
    where: {
      tenantId: tenant.id,
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!access) return null;

  await prisma.portalAccessToken.update({
    where: { id: access.id },
    data: { lastUsedAt: new Date() },
  });

  return { tenant, client: access.client, access };
}

export async function listPortalInvites(tenantId: string, clientId: string) {
  return prisma.portalAccessToken.findMany({
    where: { tenantId, clientId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      expiresAt: true,
      revokedAt: true,
      lastUsedAt: true,
      createdAt: true,
    },
  });
}

export async function revokePortalInvite(
  tenantId: string,
  clientId: string,
  inviteId: string,
): Promise<boolean> {
  const existing = await prisma.portalAccessToken.findFirst({
    where: { id: inviteId, tenantId, clientId, revokedAt: null },
  });

  if (!existing) return false;

  await prisma.portalAccessToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  return true;
}
