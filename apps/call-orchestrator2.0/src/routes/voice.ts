import { FastifyInstance } from "fastify";
import { escapeXml } from "../utils/twilio.js";
import { callContext } from "../utils/context.js";
import { logger } from "../config/logger.js";
import { fetchListingByNumber, logCallStart } from "../services/crm.js";

export default async function voiceRoutes(fastify: FastifyInstance) {
  // Debug route to fetch listing by number or active listing for the group
  fastify.get("/debug/listing", async (req, reply) => {
    const to = String((req.query as any).to || "");
    if (!to) return reply.code(400).send({ error: "Pass ?to=+353..." });

    try {
      const listing = await fetchListingByNumber({ to_e164: to });
      return reply.send({ ok: true, to, listing: listing ?? null });
    } catch (e: any) {
      return reply
        .code(500)
        .send({ ok: false, to, error: String(e?.message || e) });
    }
  });

  // Route for Twilio to handle incoming calls
  fastify.all("/incoming-call", async (request, reply) => {
    const { From, To, CallSid, Caller } = (request as any).body || {};

    // Default/fallback greeting
    let propLabel = "our property";
    let greeting = `Welcome to ${propLabel}, how can we help you today?`;

    // Try to record the call start and attach listing (non-fatal on error)
    try {
      const listing = To ? await fetchListingByNumber({ to_e164: To }) : null;

      if (CallSid) callContext.set(CallSid, { listing, preGreeted: true });
      propLabel = (listing?.title || listing?.address || propLabel) as string;
      greeting = `Welcome to ${propLabel}, how can we help you today?`;

      logger.info(
        {
          callSid: CallSid,
          to: To,
          listing_id: listing?.id,
          title: listing?.title,
        },
        "Resolved listing for incoming call"
      );

      await logCallStart({
        callSid: CallSid,
        from: From,
        to: To,
        callerName: Caller ?? undefined,
        meta: { source: "voice-webhook", listingId: listing?.id ?? null },
      });
    } catch (e) {
      logger?.error("Error logging call start:", e);
    }

    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Google.en-US-Chirp3-HD-Aoede">${escapeXml(greeting)}</Say>
  <Connect>
    <Stream url="wss://${request.headers.host}/media-stream" />
  </Connect>
</Response>`;

    reply.type("text/xml").send(twimlResponse);
  });
}
