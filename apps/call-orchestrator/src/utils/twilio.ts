import twilio from 'twilio';
import { isValidationEnabled } from '../config/env';

export function twilioWebhookMiddleware() {
  if (!isValidationEnabled) {
    return (req: any, _res: any, next: any) => next();
  }
  return twilio.webhook({ validate: true, protocol: 'https' });
}
