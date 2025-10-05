import { Router } from 'express';
import { logCallEnd } from '../services/crm';
import { logger } from '../config/logger';

export const statusRouter = Router();

statusRouter.post('/status', async (req, res) => {
    const { CallSid, CallStatus, CallDuration } = req.body || {};
    logger.info({ CallSid, CallStatus, CallDuration }, 'Twilio status callback');

    if (CallSid && CallStatus) {
        await logCallEnd({
            callSid: CallSid,
            status: CallStatus,                              // 'completed','busy','no-answer','failed',...
            durationSeconds: CallDuration ? Number(CallDuration) : undefined,
            meta: { source: 'twilio-status' },
        });
    }
    res.type('text/xml').send('<Response/>');
});
