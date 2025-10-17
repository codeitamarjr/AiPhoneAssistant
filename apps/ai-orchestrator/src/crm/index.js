// src/crm/index.js
import { createHttpClient, sanitizeBaseUrl } from './httpClient.js';
import { createListingsApi } from './resources/listings.js';
import { createCallsApi } from './resources/calls.js';
import { createLeadsApi } from './resources/leads.js';
import { createAppointmentsApi } from './resources/appointments.js';

export function createCRMClient({ baseUrl, token, log = () => {} }) {
    const sanitizedBaseUrl = sanitizeBaseUrl(baseUrl);
    if (!sanitizedBaseUrl) {
        log('warn', 'CRM_BASE_URL not set; CRM calls disabled');
    }

    const http = createHttpClient({ baseUrl: sanitizedBaseUrl, token });

    const listings = createListingsApi(http, log);
    const calls = createCallsApi(http, log);
    const leads = createLeadsApi(http, log);
    const appointments = createAppointmentsApi(http, log);

    return {
        baseUrl: sanitizedBaseUrl,
        isEnabled: Boolean(http),

        listings,
        calls,
        leads,
        appointments,
    };
}
