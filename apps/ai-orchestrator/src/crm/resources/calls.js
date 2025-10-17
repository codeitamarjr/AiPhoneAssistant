// src/crm/resources/calls.js
export function createCallsApi(http, log) {
    return {
        async start({ callSid, from, to, ctx }) {
            if (!http) return null;
            try {
                const { data } = await http.post('/api/calls/start', {
                    twilio_call_sid: callSid,
                    from_e164: from,
                    to_e164: to,
                    caller_name: null,
                    started_at: new Date().toISOString(),
                    status: 'in-progress',
                    meta: { source: 'openai-sip-webhook' },
                });

                const callLogId = data?.id ?? null;
                log('debug', 'crm:calls:start', { ctx, callSid, call_log_id: callLogId });
                return callLogId;
            } catch (error) {
                log('warn', 'crm:calls:start:failed', {
                    ctx,
                    callSid,
                    status: error?.response?.status,
                    err: error?.message,
                });
                return null;
            }
        },

        async end({ callSid, status = 'completed', durationSeconds = null, callerName = null, meta = {}, ctx }) {
            if (!http) return;
            try {
                await http.post('/api/calls/end', {
                    twilio_call_sid: callSid,
                    status,
                    ended_at: new Date().toISOString(),
                    duration_seconds: durationSeconds,
                    caller_name: callerName,
                    meta,
                });
                log('debug', 'crm:calls:end', { ctx, callSid, status });
            } catch (error) {
                log('warn', 'crm:calls:end:failed', {
                    ctx,
                    callSid,
                    status: error?.response?.status,
                    err: error?.message,
                });
            }
        },
    };
}
