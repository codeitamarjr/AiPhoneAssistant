import { Router } from 'express';
import twilio from 'twilio';
import { logger } from '../config/logger';
import { twilioWebhookMiddleware } from '../utils/twilio';
import { logCallStart } from '../services/crm';

export const voiceRouter = Router();

// src/routes/voice.ts
voiceRouter.post('/voice', twilioWebhookMiddleware(), async (req, res) => {
  const { From, To, CallSid } = req.body || {};

  // Try to log, but don't crash the webhook if it fails
  try {
    if (From && To && CallSid) {
      await logCallStart({ callSid: CallSid, from: From, to: To });
    }
  } catch (e: any) {
    logger.error({ err: e?.message }, 'Non-fatal: failed to log call start');
    // continue anyway
  }

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say(
    { voice: 'Polly.Amy' },
    'Hi! You’ve reached the property information line. I am an A I assistant and this call may be recorded.'
  );
  const connect = twiml.connect();
  connect.stream({ url: `${process.env.PUBLIC_BASE_URL}/media`, track: 'both_tracks' });

  res.type('text/xml').send(twiml.toString());
});

