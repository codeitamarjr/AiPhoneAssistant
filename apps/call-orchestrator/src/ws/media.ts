import { WebSocketServer } from 'ws';
import { logger } from '../config/logger';
import { logCallEnd } from '../services/crm';
import type { IncomingMessage } from 'http';

type ClientState = {
  callSid?: string;
  from?: string;
  to?: string;
  startedAt?: number;
  ended?: boolean;
};

export function attachMediaWs(server: import('http').Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    if (!req.url?.startsWith('/media')) return;
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws) => {
    const state: ClientState = {};

    ws.on('message', async (buf) => {
      try {
        const msg = JSON.parse(buf.toString());

        // Twilio events: "start" | "media" | "mark" | "stop"
        if (msg.event === 'start') {
          state.callSid = msg.start?.callSid;
          state.from = msg.start?.customParameters?.from || msg.start?.from; // customParameters if you add later
          state.to = msg.start?.to;
          state.startedAt = Date.now();
        }

        if (msg.event === 'media') {
          // msg.media.payload is base64 μ-law 8kHz audio
          // For MVP we ignore audio; later feed to STT here.
        }

        if (msg.event === 'stop' && state.callSid && !state.ended) {
          state.ended = true;
          const duration =
            msg.stop?.duration ??
            (state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : undefined);

          logger.info({ callSid: state.callSid, duration }, 'Call ended (stop), notifying API');
          try {
            await logCallEnd({
              callSid: state.callSid,
              status: 'completed',
              durationSeconds: duration ?? null,
            });
          } catch (e: any) {
            logger.error({ err: e?.message }, 'Failed to log call end (stop)');
          }
        }
      } catch (e: any) {
        // Non-fatal parsing error
      }
    });

    ws.on('close', async () => {
      if (state.callSid && !state.ended) {
        state.ended = true; // <— guard
        logger.info({ callSid: state.callSid }, 'Media WS closed, notifying API (safety)');
        try {
          await logCallEnd({ callSid: state.callSid, status: 'completed' });
        } catch (e: any) {
          logger.error({ err: e?.message }, 'Failed to log call end (close)');
        }
      }
    });
  });

  return wss;
}
