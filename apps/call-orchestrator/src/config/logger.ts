import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.APP_ENV === 'local' ? { target: 'pino-pretty' } : undefined,
});
