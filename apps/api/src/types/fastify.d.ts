import { Tenant } from "@prisma/client";
import "fastify";
import type { AuthUser } from "../lib/auth.js";

declare module "fastify" {
  interface FastifyRequest {
    tenant?: Tenant;
    user?: AuthUser;
  }
}
