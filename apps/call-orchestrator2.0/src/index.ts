import Fastify from "fastify";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import dotenv from "dotenv"; // keep to match your original
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

// Load environment variables (kept to preserve your original logic)
dotenv.config();

// Retrieve the OpenAI API key from environment variables.
const { OPENAI_API_KEY } = process.env;

if (!OPENAI_API_KEY) {
  console.error("Missing OpenAI API key. Please set it in the .env file.");
  process.exit(1);
}
if (!env?.WEB_API_BASE_URL || !env?.API_TOKEN) {
  console.error("Missing CRM envs: WEB_API_BASE_URL or API_TOKEN.");
  process.exit(1);
}

// Initialize Fastify
const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

// Routes
import statusRoutes from "./routes/status.js";
import voiceRoutes from "./routes/voice.js";
import registerMediaWs from "./ws/media.js";

fastify.register(statusRoutes);
fastify.register(voiceRoutes);
fastify.register(registerMediaWs);

// Start
const PORT = Number(process.env.PORT) || 5050; // keep your default
fastify.listen({ port: PORT }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server is listening on port ${PORT}`);
});
