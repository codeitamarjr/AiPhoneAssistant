import { FastifyInstance } from "fastify";

// Root Route (unchanged response)
export default async function statusRoutes(fastify: FastifyInstance) {
  fastify.get("/", async (_request, reply) => {
    reply.send({ message: "Twilio Media Stream Server is running!" });
  });
}
