import { FastifyInstance } from "fastify";
import WebSocket from "ws";
import { logger } from "../config/logger.js";
import { callContext } from "../utils/context.js";
import { sendWhenOpen } from "../utils/twilio.js";
import { logCallEnd } from "../services/crm.js";

// Constants (moved here from your single file, values unchanged)
const SYSTEM_MESSAGE =
  "You are a helpful and bubbly AI assistant who loves to chat about anything the user is interested about and is prepared to offer them facts. You have a penchant for dad jokes, owl jokes, and rickrolling – subtly. Always stay positive, but work in a joke when appropriate.";
const VOICE = "alloy";
const TEMPERATURE = 0.8;
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
const SHOW_TIMING_MATH = false;

export default async function registerMediaWs(fastify: FastifyInstance) {
  fastify.get("/media-stream", { websocket: true }, (connection, _req) => {
    console.log("Client connected");

    // Connection-specific state
    let streamSid: string | null = null;
    let latestMediaTimestamp = 0;
    let lastAssistantItem: string | null = null;
    let lastAssistantDurationMs: number | null = null;
    let markQueue: string[] = [];
    let responseStartTimestampTwilio: number | null = null;
    let callSid: string | null = null;
    let callEnded = false;
    let greeted = false;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;

    const openAiWs = new WebSocket(
      `wss://api.openai.com/v1/realtime?model=gpt-realtime&temperature=${TEMPERATURE}`,
      { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
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
            input: { format: { type: "audio/pcmu" }, turn_detection: { type: "server_vad" } },
            output: { format: { type: "audio/pcmu" }, voice: VOICE },
          },
          instructions: SYSTEM_MESSAGE,
        },
      };

      console.log("Sending session update:", JSON.stringify(sessionUpdate));
      openAiWs.send(JSON.stringify(sessionUpdate));
    };

    // Send initial conversation item if AI talks first
    const sendInitialConversationItem = (text: string) => {
      const initialConversationItem = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text }],
        },
      };

      if (SHOW_TIMING_MATH)
        console.log("Sending initial conversation item:", JSON.stringify(initialConversationItem));

      openAiWs.send(JSON.stringify(initialConversationItem));
      openAiWs.send(
        JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio"],
            audio: { format: { type: "audio/pcmu" }, voice: VOICE },
          },
        })
      );
    };

    // Handle interruption when the caller's speech starts
    const handleSpeechStartedEvent = () => {
      if (markQueue.length > 0 && responseStartTimestampTwilio != null) {
        let elapsedTime = latestMediaTimestamp - responseStartTimestampTwilio;

        if (lastAssistantDurationMs == null) return; // guard

        // Clamp to available audio duration
        elapsedTime = Math.max(0, Math.min(elapsedTime, lastAssistantDurationMs - 10));

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
          if (SHOW_TIMING_MATH) console.log("Sending truncation event:", JSON.stringify(truncateEvent));
          openAiWs.send(JSON.stringify(truncateEvent));
        }

        connection.send(JSON.stringify({ event: "clear", streamSid }));

        // Reset
        markQueue = [];
        lastAssistantItem = null;
        responseStartTimestampTwilio = null;
        lastAssistantDurationMs = null;
      }
    };

    // Send mark messages to Media Streams so we know if and when AI response playback is finished
    const sendMark = (streamSidLocal?: string | null) => {
      if (streamSidLocal) {
        const markEvent = { event: "mark", streamSid: streamSidLocal, mark: { name: "responsePart" } };
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
      let msg: any;
      try {
        msg = JSON.parse(String(data));

        if (LOG_EVENT_TYPES.includes(msg.type)) {
          console.log(`Received event: ${msg.type}`, msg);
        }

        if (msg.type === "response.output_text.delta" && msg.delta) {
          console.log("Model text delta:", msg.delta);
        }

        if (msg.type === "response.output_audio.delta" && msg.delta) {
          const audioDelta = { event: "media", streamSid, media: { payload: msg.delta } };
          connection.send(JSON.stringify(audioDelta));

          // First delta from a new response starts the elapsed time counter
          if (!responseStartTimestampTwilio) {
            responseStartTimestampTwilio = latestMediaTimestamp;
            if (SHOW_TIMING_MATH)
              console.log(`Setting start timestamp for new response: ${responseStartTimestampTwilio}ms`);
          }

          if (msg.item_id) lastAssistantItem = msg.item_id;
          sendMark(streamSid);
        }

        if (msg.type === "input_audio_buffer.speech_started") {
          handleSpeechStartedEvent();
        }
      } catch (error) {
        console.error("Error processing OpenAI message:", error, "Raw message:", String(data));
      }

      if (msg?.type === "response.done" && msg.response?.audio?.output?.length) {
        const outs = msg.response.audio.output;
        const last = outs[outs.length - 1];
        if (typeof last?.duration_ms === "number") {
          lastAssistantDurationMs = last.duration_ms;
        }
      }
    });

    // Handle incoming messages from Twilio
    connection.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);

        switch (data.event) {
          case "media":
            latestMediaTimestamp = data.media.timestamp;
            if (SHOW_TIMING_MATH)
              console.log(`Received media message with timestamp: ${latestMediaTimestamp}ms`);
            if (openAiWs.readyState === WebSocket.OPEN) {
              openAiWs.send(JSON.stringify({ type: "input_audio_buffer.append", audio: data.media.payload }));
            }
            break;

          case "start":
            streamSid = data.start.streamSid;
            callSid = data.start?.callSid ?? callSid;
            console.log("Incoming stream has started", streamSid);

            // Reset start and media timestamp on a new stream
            responseStartTimestampTwilio = null;
            latestMediaTimestamp = 0;

            const ctx = callSid ? callContext.get(callSid) : undefined;
            if (!greeted && !ctx?.preGreeted) {
              const listing = ctx?.listing;
              const propLabel = (listing?.title || listing?.address || "our property") as string;
              const greetText = `Say exactly: "Welcome to ${propLabel}, how can we help you today?"`;

              sendWhenOpen(openAiWs, () => sendInitialConversationItem(greetText));
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
                meta: { source: "media-stream", streamSid: streamSid ?? undefined },
              }).catch((e) => logger?.error?.("Error logging call end:", e));
            }
            break;

          case "mark":
            if (markQueue.length > 0) markQueue.shift();
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
          meta: { source: "media-stream:close", streamSid: streamSid ?? undefined },
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
}
