import { FastifyInstance } from "fastify";
import { z } from "zod";
import { askAssistant } from "../lib/assistant.js";
import { requireAuth, requireTenantMember } from "../lib/requireAuth.js";
import { resolveTenant, TenantNotFoundError } from "../lib/tenant.js";

const chatSchema = z.object({
  question: z.string().min(1).max(1000),
});

export async function assistantRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (request, reply) => {
    try {
      const tenant = await resolveTenant(request);
      if (!tenant) {
        return reply.status(400).send({
          error: "Missing X-Tenant-Slug header",
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

  /** Natural-language analytics over this studio's data. */
  app.post("/chat", async (request) => {
    const tenant = request.tenant!;
    const body = chatSchema.parse(request.body);
    return askAssistant(tenant.id, body.question);
  });
}
