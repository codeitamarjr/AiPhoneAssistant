import { WebSocketServer } from 'ws';
import { logger } from '../config/logger';
import { logCallEnd, createLead } from '../services/crm';
import type { IncomingMessage } from 'http';
import { verifySession } from '../utils/jwt';
import { env } from '../config/env';
import { startLiveSTT } from '../services/stt';
import { synthesize } from '../services/tts';
import { getContext, clearContext } from '../utils/context';
import { linear16ToMulaw } from '../utils/audio';

type SessionToken = { callSid: string };

type ClientState = {
  callSid?: string;
  from?: string;
  to?: string;
  startedAt?: number;
  ended?: boolean;
  listing?: any | null;
  groupId?: number;
  callerName?: string;
  speaking?: boolean; // are we currently streaming TTS?
  streamSid?: string;
};

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

function buildSystem(listing?: any | null) {
  if (!listing) return 'You are an AI Lettings Assistant. Be concise, helpful, and collect caller name politely.';
  const feats = Array.isArray(listing.features) ? listing.features.slice(0, 10).join(', ') : '';
  return [
    'You are an AI Lettings Assistant for THIS property.',
    'Answer accurately and concisely. If asked off-topic, steer back politely.',
    'Politely ask for the caller’s name early.',
    `PROPERTY: ${listing.title} — ${listing.address}`,
    `Rent: ${listing.price != null ? `€${listing.price}/month` : '—'} | Beds: ${listing.beds ?? '—'} | Baths: ${listing.baths ?? '—'}`,
    feats ? `Key features: ${feats}` : '',
    listing.viewing_notes ? `Viewing notes: ${listing.viewing_notes}` : '',
  ].filter(Boolean).join('\n');
}

function openingLine(listing?: any | null) {
  if (!listing) return 'Thanks for calling. I can help with property questions and viewings. May I take your name?';
  return `Thanks for calling about ${listing.title} at ${listing.address}. I can help with details and viewings. May I take your name?`;
}

function extractLikelyName(text: string) {
  const m = text.match(/\b(my name is|this is|i am|it's)\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){0,2})/i);
  return m?.[2]?.trim();
}

async function speak(ws: import('ws'), text: string, state: ClientState) {
  state.speaking = true;

  // Polly returns PCM16 mono 8k (you set SampleRate: '8000')
  const pcm16 = await synthesize(text, { format: 'mulaw', sampleRate: 8000, voice: 'Amy' });
  const mulaw = linear16ToMulaw(pcm16);

  const streamSid = state.streamSid;
  if (!streamSid) {
    logger.warn({ callSid: state.callSid }, 'speak invoked without streamSid');
    state.speaking = false;
    return;
  }

  // ~20ms per chunk @8k μ-law = 160 bytes
  const CHUNK = 160;
  for (let i = 0; i < mulaw.length; i += CHUNK) {
    if (!state.speaking) break; // barge-in
    const slice = mulaw.subarray(i, i + CHUNK);

    ws.send(JSON.stringify({
      event: 'media',
      streamSid,                               // TOP-LEVEL streamSid
      media: { payload: slice.toString('base64') } // no "track"
    }));

    await sleep(20); // pacing
  }

  ws.send(JSON.stringify({ event: 'mark', streamSid, mark: { name: 'eos' } }));
  state.speaking = false;
}

export function attachMediaWs(server: import('http').Server) {
  const wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
    handleProtocols: (protocols: any /* Array<string> | Set<string> */, _req: any) => {
      const list: string[] = Array.isArray(protocols)
        ? protocols
        : (typeof protocols?.forEach === 'function'
          ? Array.from(protocols as Set<string>)
          : []);
      return list.includes('audio.twilio.com') ? 'audio.twilio.com' : false;
    },
  });

  server.on('upgrade', (req, socket, head) => {
    console.log('[WS upgrade]', req.url, 'proto=', req.headers['sec-websocket-protocol']);
    if (!req.url?.startsWith('/media')) return;
    wss.handleUpgrade(req, socket, head, (ws) => {
      console.log('[WS connected]', req.url);
      wss.emit('connection', ws, req);
    });
  });


  wss.on('connection', (ws, req: IncomingMessage) => {
    console.log('[WS connection open]', req.url, 'negotiated=', (ws as any).protocol);

    // --- 1) Decode tiny token -> callSid
    const url = new URL(req.url || '/media', `http://${req.headers.host}`);
    const token = url.searchParams.get('session') || '';
    let callSid = '';
    try {
      const decoded = verifySession<SessionToken>(token);
      callSid = decoded?.callSid || '';
    } catch {
      // keep callSid empty; we’ll handle missing context below
    }

    // --- 2) Pull full context from memory (set in /voice)
    const ctx = callSid ? getContext(callSid) : null;

    const state: ClientState = {
      callSid,
      from: ctx?.from,
      to: ctx?.to,
      listing: ctx?.listing ?? null,
      groupId: ctx?.groupId ?? env.GROUP_ID,
      speaking: false,
    };

    const system = buildSystem(state.listing);

    // Live STT session
    const stt = startLiveSTT();
    stt.onPartial = () => { if (state.speaking) state.speaking = false; };
    stt.onFinal = async (text) => {
      if (!state.callerName) {
        const name = extractLikelyName(text);
        if (name) {
          state.callerName = name;
          await speak(ws, `Thanks ${name}. What would you like to know about the property?`, state);
          return;
        }
      }
      const reply = await simpleLettingsReply(system, state.listing, text);
      await speak(ws, reply, state);
    };

    ws.on('message', async (buf) => {
      // Optional: quick visibility into Twilio lifecycle
      const raw = buf.toString();
      if (raw.includes('"event":"start"')) console.log('[WS msg] start:', raw.slice(0, 180));
      if (raw.includes('"event":"stop"')) console.log('[WS msg] stop');

      try {
        const msg = JSON.parse(raw);

        if (msg.event === 'start') {
          state.startedAt = Date.now();
          state.callSid = state.callSid || msg.start?.callSid;
          state.from = state.from || msg.start?.from || msg.start?.customParameters?.from;
          state.to = state.to || msg.start?.to;
          state.streamSid = msg.start?.streamSid || state.streamSid;

          if (state.streamSid) {
            ws.send(JSON.stringify({ event: 'connected', streamSid: state.streamSid }));
          }

          await stt.ready;
          await speak(ws, openingLine(state.listing), state);
        }

        if (msg.event === 'media') {
          state.streamSid = state.streamSid || msg.streamSid;
          const mulaw = Buffer.from(msg.media.payload, 'base64');
          stt.feed(mulaw);             // Deepgram live (we convert to ArrayBuffer inside startLiveSTT)
          if (state.speaking) state.speaking = false; // barge-in
        }

        if (msg.event === 'stop' && state.callSid && !state.ended) {
          state.ended = true;
          await stt.stop();

          const duration =
            msg.stop?.duration ??
            (state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : undefined);

          try {
            await createLead({
              group_id: state.groupId!,
              listing_id: state.listing?.id ?? null,
              call_log_id: null,
              name: state.callerName ?? null,
              phone_e164: state.from || '',
              notes: 'Captured by AI Lettings Assistant',
              status: 'new',
            });
          } catch (e: any) {
            logger.error({ err: e?.message }, 'createLead failed');
          }

          try {
            await logCallEnd({
              callSid: state.callSid,
              status: 'completed',
              durationSeconds: duration ?? null,
              callerName: state.callerName ?? undefined,
            });
          } catch (e: any) {
            logger.error({ err: e?.message }, 'logCallEnd failed');
          }

          // cleanup stored context
          clearContext(state.callSid);
        }
      } catch (e: any) {
        logger.error({ err: e?.message }, 'WS parse error');
      }
    });

    ws.on('close', async (code, reason) => {
      console.log('[WS connection closed]', code, reason.toString());
      try { await stt.stop(); } catch { }
      if (state.callSid && !state.ended) {
        state.ended = true;
        try {
          await createLead({
            group_id: state.groupId!,
            listing_id: state.listing?.id ?? null,
            call_log_id: null,
            name: state.callerName ?? null,
            phone_e164: state.from || '',
            notes: 'Captured by AI Lettings Assistant',
            status: 'new',
          });
        } catch (e: any) { logger.error({ err: e?.message }, 'createLead failed (close)'); }
        try { await logCallEnd({ callSid: state.callSid, status: 'completed' }); }
        catch (e: any) { logger.error({ err: e?.message }, 'logCallEnd failed (close)'); }
      }
      if (state.callSid) clearContext(state.callSid);
    });
  });

  return wss;
}

/** Super-light fallback responder. Replace with your llm.complete() when ready. */
async function simpleLettingsReply(system: string, listing: any, user: string): Promise<string> {
  const u = user.toLowerCase();
  if (u.includes('rent') || u.includes('price')) return `The rent is ${listing?.price != null ? `€${listing.price} per month` : 'currently unavailable.'}`;
  if (u.includes('bed') || u.includes('bedroom')) return `It has ${listing?.beds ?? '—'} bedrooms.`;
  if (u.includes('bath')) return `It has ${listing?.baths ?? '—'} bathrooms.`;
  if (u.includes('view') || u.includes('viewing')) return `Viewings are available by appointment. May I confirm your email to send details?`;
  return `Happy to help. What would you like to know about the property?`;
}
