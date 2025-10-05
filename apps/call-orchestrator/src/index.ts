import express from 'express';
import http from 'http';
import { env } from './config/env';
import { logger } from './config/logger';
import { voiceRouter } from './routes/voice';
import bodyParser from 'body-parser';
import { attachMediaWs } from './ws/media';
import { statusRouter } from './routes/status';


const app = express();

// Twilio sends x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/twilio', voiceRouter);
app.use('/twilio', statusRouter);

const server = http.createServer(app);
attachMediaWs(server);

server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, public: process.env.PUBLIC_BASE_URL }, 'Call orchestrator listening');
});
