import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { ZodError } from "zod";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { tenantRoutes } from "./routes/tenants.js";
import { clientRoutes } from "./routes/clients.js";
import { orderRoutes } from "./routes/orders.js";
import { assistantRoutes } from "./routes/assistant.js";
import { portalRoutes } from "./routes/portal.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      const message = error.issues.map((i) => i.message).join("; ");
      return reply.status(400).send({ error: message || "Validation failed" });
    }

    app.log.error(error);
    return reply.status(500).send({ error: "Internal server error" });
  });

  await app.register(helmet);
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    credentials: true,
  });

  await app.register(healthRoutes, { prefix: "/health" });
  await app.register(authRoutes, { prefix: "/api/v1/auth" });
  await app.register(tenantRoutes, { prefix: "/api/v1/tenants" });
  await app.register(portalRoutes, { prefix: "/api/v1/portal" });
  await app.register(clientRoutes, { prefix: "/api/v1/clients" });
  await app.register(orderRoutes, { prefix: "/api/v1/orders" });
  await app.register(assistantRoutes, { prefix: "/api/v1/assistant" });

  return app;
}
