// src/config.js
import 'dotenv/config';

const raw = process.env;

export const config = Object.freeze({
    port: Number(raw.PORT ?? 5050),
    openaiApiKey: raw.OPENAI_API_KEY,
    openaiWebhookSecret: raw.OPENAI_WEBHOOK_SECRET,
    realtimeModel: raw.REALTIME_MODEL ?? 'gpt-realtime',
    realtimeVoice: raw.REALTIME_VOICE ?? 'alloy',
    crmBaseUrl: raw.CRM_BASE_URL,
    crmToken: raw.CRM_TOKEN,
    logLevel: raw.LOG_LEVEL ?? 'debug',
});

const required = ['openaiApiKey', 'openaiWebhookSecret'];

export function assertRequiredConfig(log) {
    const missing = required.filter((key) => !config[key]);
    if (!missing.length) return;

    log('error', 'Missing required config', { missing });
    process.exit(1);
}
