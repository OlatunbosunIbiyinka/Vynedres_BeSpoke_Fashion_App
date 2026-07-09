import { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/", async () => ({
    status: "ok",
    service: "vynedres-api",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  }));

  app.get("/ready", async () => {
    // Extend later: check database connectivity
    return { status: "ready" };
  });
}
