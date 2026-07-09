/**
 * Auth primitives: password hashing + JWT sessions.
 *
 * Flow:
 *   login → verify password → issue JWT → client sends Bearer token
 *   protected routes → verify JWT → ensure user.tenantId matches studio
 */

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
};

export type JwtPayload = {
  sub: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set (min 16 characters)");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function signAccessToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? "7d")
    .sign(getJwtSecret());
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret());

  const sub = payload.sub;
  const tenantId = payload.tenantId;
  const email = payload.email;
  const name = payload.name;
  const role = payload.role;

  if (
    typeof sub !== "string" ||
    typeof tenantId !== "string" ||
    typeof email !== "string" ||
    typeof name !== "string" ||
    (role !== "OWNER" && role !== "STAFF")
  ) {
    throw new Error("Invalid token payload");
  }

  return { sub, tenantId, email, name, role };
}

export function publicUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
  };
}
