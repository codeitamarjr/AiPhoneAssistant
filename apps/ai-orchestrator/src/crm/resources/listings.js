// src/crm/resources/listings.js
export function createListingsApi(http, log) {
    return {
        async fetchActiveByNumber(toE164, ctx) {
            if (!http) {
                log('warn', 'CRM_BASE_URL not set; listing lookup skipped', { ctx, toE164 });
                return null;
            }

            if (!toE164) {
                log('warn', 'No dialed number found; skipping listing lookup', { ctx });
                return null;
            }

            const t0 = performance.now();

            try {
                const { data, status } = await http.get('/api/listings/by-number', { params: { to_e164: toE164 } });
                log('info', 'CRM listing lookup ok', {
                    ctx,
                    status,
                    to_e164: toE164,
                    ms: (performance.now() - t0).toFixed(1),
                });
                return data ?? null;
            } catch (error) {
                log('warn', 'CRM listing lookup failed', {
                    ctx,
                    to_e164: toE164,
                    status: error?.response?.status,
                    err: error?.message,
                    ms: (performance.now() - t0).toFixed(1),
                    body:
                        error?.response?.data && typeof error.response.data === 'object'
                            ? JSON.stringify(error.response.data).slice(0, 800)
                            : undefined,
                });
                return null;
            }
        },
    };
}
