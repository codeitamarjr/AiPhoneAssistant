import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  PUBLIC_BASE_URL: z.string().url(),
  APP_ENV: z.string().default('local'),
  LOG_LEVEL: z.string().default('info'),
  TTS_VOICE: z.string().default('Polly.Amy'),
  WEB_API_BASE_URL: z.string().url(),
  API_TOKEN: z.string().min(8),
  GROUP_ID: z.coerce.number().default(1),
  TWILIO_VALIDATE: z.string().default('false'),
});

export const env = EnvSchema.parse(process.env);
export const isValidationEnabled = env.TWILIO_VALIDATE === 'true';
