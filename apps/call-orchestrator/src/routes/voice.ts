import { Router } from 'express';
import twilio from 'twilio';
import { logger } from '../config/logger';
import { twilioWebhookMiddleware } from '../utils/twilio';
import { logCallStart, fetchActiveListing } from '../services/crm';
import { env } from '../config/env';
import { signSession } from '../utils/jwt';
import { setContext } from '../utils/context';

export const voiceRouter = Router();

voiceRouter.post('/voice', twilioWebhookMiddleware(), async (req, res) => {
  const { From, To, CallSid } = req.body || {};

  let listing: any | null = null;
  try {
    listing = await fetchActiveListing(env.GROUP_ID);
    await logCallStart({ callSid: CallSid, from: From, to: To,
      meta: { source: 'voice-webhook', activeListingId: listing?.id ?? null } });
  } catch (e:any) { logger.error({ err: e?.message }, 'Non-fatal: listing resolve or call start log failed'); }

  // store full context server-side — not in the URL
  setContext(CallSid, { from: From, to: To, groupId: env.GROUP_ID, listing });

  // **tiny** JWT: only callSid (10 min expiry)
  const session = signSession({ callSid: CallSid }, '10m');

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say({ voice: 'Polly.Amy' }, 'Hi! You’ve reached the property information line. I am an A I assistant and this call may be recorded.');

  const base = process.env.PUBLIC_BASE_URL!;
  const wssUrl = base.replace(/^http/i, 'ws');
  const streamUrl = `${wssUrl}/media?session=${encodeURIComponent(session)}`;
  logger.info({ streamUrl }, 'Twilio Stream URL');

  const connect = twiml.connect();
  connect.stream({ url: streamUrl, track: 'both_tracks' });
  res.type('text/xml').send(twiml.toString());
});

