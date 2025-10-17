// src/crm/resources/leads.js
export function createLeadsApi(http, log) {
    async function create(payload, ctx) {
        if (!http) return null;
        const t0 = performance.now();
        try {
            const { data, status } = await http.post('/api/leads', payload);
            log('info', 'crm:leads:create', { ctx, status, ms: (performance.now() - t0).toFixed(1), id: data?.id });
            return data ?? null;
        } catch (error) {
            log('warn', 'crm:leads:create:failed', {
                ctx,
                status: error?.response?.status,
                err: error?.message,
                body:
                    error?.response?.data && typeof error.response.data === 'object'
                        ? JSON.stringify(error.response.data).slice(0, 800)
                        : undefined,
            });
            return null;
        }
    }

    return {
        create,

        async createForCall({ callLogId, listingId, from, name = null, email = null, notes = null, status = 'new', ctx }) {
            if (!from) {
                log('info', 'crm:leads:create:skipped:no-phone', { ctx });
                return null;
            }

            if (!callLogId && !listingId) {
                log('info', 'crm:leads:create:skipped:no-context', { ctx });
                return null;
            }

            const payload = {
                listing_id: listingId ?? null,
                call_log_id: callLogId ?? null,
                name: name || null,
                phone_e164: from,
                email: email || null,
                notes: notes || null,
                status,
            };

            return create(payload, ctx);
        },
    };
}
