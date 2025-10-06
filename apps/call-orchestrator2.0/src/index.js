import Fastify from "fastify";
import WebSocket from "ws";
import dotenv from "dotenv";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import {
  logCallStart,
  logCallEnd,
  fetchListingByNumber,
} from "./services/crm.js";

// Load environment variables from .env file
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

// Constants
const SYSTEM_MESSAGE =
  "You are a helpful and bubbly AI assistant who loves to chat about anything the user is interested about and is prepared to offer them facts. You have a penchant for dad jokes, owl jokes, and rickrolling – subtly. Always stay positive, but work in a joke when appropriate.";
const VOICE = "alloy";
const TEMPERATURE = 0.8; // Controls the randomness of the AI's responses
const PORT = process.env.PORT || 5050; // Allow dynamic port assignment

// List of Event Types to log to the console. See the OpenAI Realtime API Documentation: https://platform.openai.com/docs/api-reference/realtime
const LOG_EVENT_TYPES = [
  "error",
  "response.content.done",
  "rate_limits.updated",
  "response.done",
  "input_audio_buffer.committed",
  "input_audio_buffer.speech_stopped",
  "input_audio_buffer.speech_started",
  "session.created",
  "session.updated",
];

// Show AI response elapsed timing calculations
const SHOW_TIMING_MATH = false;
// In-memory call context store (for active listing, etc)
const callContext = new Map();

function sendWhenOpen(ws, fn) {
  if (ws.readyState === ws.OPEN) {
    fn();
  } else {
    const onOpen = () => {
      ws.removeEventListener?.("open", onOpen);
      fn();
    };
    ws.addEventListener?.("open", onOpen);
  }
}

// Root Route
fastify.get("/", async (request, reply) => {
  reply.send({ message: "Twilio Media Stream Server is running!" });
});

// Debug route to fetch listing by number or active listing for the group
fastify.get("/debug/listing", async (req, reply) => {
  const to = String(req.query.to || "");
  if (!to) return reply.code(400).send({ error: "Pass ?to=+353..." });

  try {
    const listing = await fetchListingByNumber({ to_e164: to });
    return reply.send({ ok: true, to, listing: listing ?? null });
  } catch (e) {
    return reply
      .code(500)
      .send({ ok: false, to, error: String(e?.message || e) });
  }
});

// Route for Twilio to handle incoming calls
// <Say> punctuation to improve text-to-speech translation
fastify.all("/incoming-call", async (request, reply) => {
  const { From, To, CallSid, Caller } = request.body || {};

  // Try to record the call start attach an active listing (non-fatal on error)
  try {
    const listing = To ? await fetchListingByNumber({ to_e164: To }) : null;

    if (CallSid) callContext.set(CallSid, { listing });
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
                              <Say voice="Google.en-US-Chirp3-HD-Aoede">Please wait while we connect your call to the A. I. voice assistant, powered by Twilio and the Open A I Realtime API</Say>
                              <Pause length="1"/>
                              <Say voice="Google.en-US-Chirp3-HD-Aoede">Connecting you now.</Say>
                              <Connect>
                                  <Stream url="wss://${request.headers.host}/media-stream" />
                              </Connect>
                          </Response>`;

  reply.type("text/xml").send(twimlResponse);
});

// WebSocket route for media-stream
fastify.register(async (fastify) => {
  fastify.get("/media-stream", { websocket: true }, (connection, req) => {
    console.log("Client connected");

    // Connection-specific state
    let streamSid = null;
    let latestMediaTimestamp = 0;
    let lastAssistantItem = null;
    let lastAssistantDurationMs = null;
    let markQueue = [];
    let responseStartTimestampTwilio = null;
    let callSid = null;
    let callEnded = false;
    let greeted = false;

    const openAiWs = new WebSocket(
      `wss://api.openai.com/v1/realtime?model=gpt-realtime&temperature=${TEMPERATURE}`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    // Control initial session with OpenAI
    const initializeSession = () => {
      const sessionUpdate = {
        type: "session.update",
        session: {
          type: "realtime",
          model: "gpt-realtime",
          output_modalities: ["audio"],
          audio: {
            input: {
              format: { type: "audio/pcmu" },
              turn_detection: { type: "server_vad" },
            },
            output: { format: { type: "audio/pcmu" }, voice: VOICE },
          },
          instructions: SYSTEM_MESSAGE,
        },
      };

      console.log("Sending session update:", JSON.stringify(sessionUpdate));
      openAiWs.send(JSON.stringify(sessionUpdate));

      // Uncomment the following line to have AI speak first:
      // sendInitialConversationItem();
    };

    // Send initial conversation item if AI talks first
    const sendInitialConversationItem = (text) => {
      const initialConversationItem = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text,
            },
          ],
        },
      };

      if (SHOW_TIMING_MATH)
        console.log(
          "Sending initial conversation item:",
          JSON.stringify(initialConversationItem)
        );
      openAiWs.send(JSON.stringify(initialConversationItem));
      openAiWs.send(
        JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio"],
            audio: {
              format: { type: "audio/pcmu" },
              voice: VOICE,
            },
          },
        })
      );
    };

    // Handle interruption when the caller's speech starts
    const handleSpeechStartedEvent = () => {
      if (markQueue.length > 0 && responseStartTimestampTwilio != null) {
        let elapsedTime = latestMediaTimestamp - responseStartTimestampTwilio;

        // Guard: if we don't know duration yet, skip truncation (prevents noisy errors)
        if (lastAssistantDurationMs == null) {
          return;
        }
        // Clamp to available audio duration
        elapsedTime = Math.max(
          0,
          Math.min(elapsedTime, lastAssistantDurationMs - 10)
        );

        if (SHOW_TIMING_MATH)
          console.log(
            `Calculating elapsed time for truncation: ${latestMediaTimestamp} - ${responseStartTimestampTwilio} = ${elapsedTime}ms`
          );

        if (lastAssistantItem) {
          const truncateEvent = {
            type: "conversation.item.truncate",
            item_id: lastAssistantItem,
            content_index: 0,
            audio_end_ms: elapsedTime,
          };
          if (SHOW_TIMING_MATH)
            console.log(
              "Sending truncation event:",
              JSON.stringify(truncateEvent)
            );
          openAiWs.send(JSON.stringify(truncateEvent));
        }

        connection.send(
          JSON.stringify({
            event: "clear",
            streamSid: streamSid,
          })
        );

        // Reset
        markQueue = [];
        lastAssistantItem = null;
        responseStartTimestampTwilio = null;
        lastAssistantDurationMs = null;
      }
    };

    // Send mark messages to Media Streams so we know if and when AI response playback is finished
    const sendMark = (connection, streamSid) => {
      if (streamSid) {
        const markEvent = {
          event: "mark",
          streamSid: streamSid,
          mark: { name: "responsePart" },
        };
        connection.send(JSON.stringify(markEvent));
        markQueue.push("responsePart");
      }
    };

    // Open event for OpenAI WebSocket
    openAiWs.on("open", () => {
      console.log("Connected to the OpenAI Realtime API");
      setTimeout(initializeSession, 100);
    });

    // Listen for messages from the OpenAI WebSocket (and send to Twilio if necessary)
    openAiWs.on("message", (data) => {
      let msg;
      try {
        msg = JSON.parse(data);

        if (LOG_EVENT_TYPES.includes(msg.type)) {
          console.log(`Received event: ${msg.type}`, msg);
        }

        if (msg.type === "response.output_text.delta" && msg.delta) {
          console.log("Model text delta:", msg.delta);
        }

        if (msg.type === "response.output_audio.delta" && msg.delta) {
          const audioDelta = {
            event: "media",
            streamSid: streamSid,
            media: { payload: msg.delta },
          };
          connection.send(JSON.stringify(audioDelta));

          // First delta from a new response starts the elapsed time counter
          if (!responseStartTimestampTwilio) {
            responseStartTimestampTwilio = latestMediaTimestamp;
            if (SHOW_TIMING_MATH)
              console.log(
                `Setting start timestamp for new response: ${responseStartTimestampTwilio}ms`
              );
          }

          if (msg.item_id) {
            lastAssistantItem = msg.item_id;
          }

          sendMark(connection, streamSid);
        }

        if (msg.type === "input_audio_buffer.speech_started") {
          handleSpeechStartedEvent();
        }
      } catch (error) {
        console.error(
          "Error processing OpenAI message:",
          error,
          "Raw message:",
          data
        );
      }

      // outside the try/catch, `msg` is still in scope
      if (
        msg?.type === "response.done" &&
        msg.response?.audio?.output?.length
      ) {
        const outs = msg.response.audio.output;
        const last = outs[outs.length - 1];
        if (typeof last?.duration_ms === "number") {
          lastAssistantDurationMs = last.duration_ms;
        }
      }
    });

    // Handle incoming messages from Twilio
    connection.on("message", (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.event) {
          case "media":
            latestMediaTimestamp = data.media.timestamp;
            if (SHOW_TIMING_MATH)
              console.log(
                `Received media message with timestamp: ${latestMediaTimestamp}ms`
              );
            if (openAiWs.readyState === WebSocket.OPEN) {
              const audioAppend = {
                type: "input_audio_buffer.append",
                audio: data.media.payload,
              };
              openAiWs.send(JSON.stringify(audioAppend));
            }
            break;
          case "start":
            streamSid = data.start.streamSid;
            callSid = data.start?.callSid ?? callSid;
            console.log("Incoming stream has started", streamSid);

            // Reset start and media timestamp on a new stream
            responseStartTimestampTwilio = null;
            latestMediaTimestamp = 0;

            if (!greeted) {
              const ctx = callContext.get(callSid);
              const listing = ctx?.listing;
              const propLabel =
                listing?.title || listing?.address || "our property";
              const greetText =
                `Greet the caller warmly. Say exactly: "Welcome to ${propLabel}. ` +
                `I'm an AI assistant—how can I help you today?"`;
              sendWhenOpen(openAiWs, () =>
                sendInitialConversationItem(greetText)
              );
              greeted = true;
            }

            break;
          case "stop":
            // Twilio sends 'stop' when the stream ends
            if (!callEnded && callSid) {
              callEnded = true;
              const durationSeconds = latestMediaTimestamp
                ? Math.max(0, Math.round(latestMediaTimestamp / 1000))
                : null;
              logCallEnd({
                callSid,
                status: "completed",
                durationSeconds,
                meta: { source: "media-stream", streamSid },
              }).catch((e) => logger?.error?.("Error logging call end:", e));
            }
            break;
          case "mark":
            if (markQueue.length > 0) {
              markQueue.shift();
            }
            break;
          default:
            console.log("Received non-media event:", data.event);
            break;
        }
      } catch (error) {
        console.error("Error parsing message:", error, "Message:", message);
      }
    });

    // Handle connection close
    connection.on("close", () => {
      if (openAiWs.readyState === WebSocket.OPEN) openAiWs.close();
      console.log("Client disconnected.");

      if (callSid) callContext.delete(callSid);

      // Best-effort end log if Twilio didn't send 'stop'
      if (!callEnded && callSid) {
        callEnded = true;
        const durationSeconds = latestMediaTimestamp
          ? Math.max(0, Math.round(latestMediaTimestamp / 1000))
          : null;
        logCallEnd({
          callSid,
          status: "completed",
          durationSeconds,
          meta: { source: "media-stream:close", streamSid },
        }).catch((e) => logger?.error?.("Error logging call end:", e));
      }
    });

    // Handle WebSocket close and errors
    openAiWs.on("close", () => {
      console.log("Disconnected from the OpenAI Realtime API");
    });

    openAiWs.on("error", (error) => {
      console.error("Error in the OpenAI WebSocket:", error);
    });
  });
});

fastify.listen({ port: PORT }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server is listening on port ${PORT}`);
});
