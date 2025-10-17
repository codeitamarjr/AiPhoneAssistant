// src/index.js
import express from 'express';
import bodyParser from 'body-parser';
import { config, assertRequiredConfig } from './config.js';
import { createLogger } from './logger.js';
import { createCRMClient } from './crm/index.js';
import { createOrchestrator } from './orchestrator.js';

const log = createLogger(config.logLevel);

assertRequiredConfig(log);

const app = express();
app.use(bodyParser.raw({ type: '*/*' }));

const crm = createCRMClient({
    baseUrl: config.crmBaseUrl,
    token: config.crmToken,
    log,
});

const orchestrator = createOrchestrator({ config, log, crm });

app.get('/', orchestrator.healthCheck);
app.post('/webhook', orchestrator.handleWebhook);

process.on('unhandledRejection', (reason) => log('error', 'unhandledRejection', { reason: String(reason) }));
process.on('uncaughtException', (error) => log('error', 'uncaughtException', { err: String(error) }));

app.listen(Number(config.port), () => log('info', 'orchestrator:listening', { url: `http://localhost:${config.port}` }));
