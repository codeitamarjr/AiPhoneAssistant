// src/crm/resources/appointments.js
export function createAppointmentsApi(http, log) {
    return {
        async getNextSlot({ listingId }, ctx) {
            if (!http || !listingId) return null;
            const t0 = performance.now();
            try {
                const { data, status } = await http.get('/api/appointments/next', { params: { listing_id: listingId } });
                log('info', 'crm:appointments:next', { ctx, status, listing_id: listingId, ms: (performance.now() - t0).toFixed(1) });
                return data ?? null;
            } catch (error) {
                log('warn', 'crm:appointments:next:failed', {
                    ctx,
                    listing_id: listingId,
                    status: error?.response?.status,
                    err: error?.message,
                    body:
                        error?.response?.data && typeof error.response.data === 'object'
                            ? JSON.stringify(error.response.data).slice(0, 800)
                            : undefined,
                });
                return { error: { status: error?.response?.status, body: error?.response?.data ?? null } };
            }
        },

        async create({ slotId, name, phone, email }, ctx) {
            if (!http || !slotId) return null;
            const t0 = performance.now();
            try {
                const payload = {
                    viewing_slot_id: slotId,
                    slot_id: slotId,
                    name,
                    phone,
                    email,
                };
                const { data, status } = await http.post('/api/appointments', payload);
                log('info', 'crm:appointments:create', {
                    ctx,
                    status,
                    id: data?.id,
                    slot_id: data?.slot_id,
                    ms: (performance.now() - t0).toFixed(1),
                });
                return data ?? null;
            } catch (error) {
                log('warn', 'crm:appointments:create:failed', {
                    ctx,
                    status: error?.response?.status,
                    err: error?.message,
                    slot_id: slotId,
                    body:
                        error?.response?.data && typeof error.response.data === 'object'
                            ? JSON.stringify(error.response.data).slice(0, 800)
                            : undefined,
                });
                return { error: { status: error?.response?.status, body: error?.response?.data ?? null } };
            }
        },

        async update({ appointmentId, slotId, name, phone, email }, ctx) {
            if (!http || !appointmentId) return null;
            const t0 = performance.now();
            try {
                const payload = {};
                if (slotId != null) {
                    payload.viewing_slot_id = slotId;
                    payload.slot_id = slotId;
                }
                if (name != null) payload.name = name;
                if (phone != null) payload.phone = phone;
                if (email != null) payload.email = email;

                const { data, status } = await http.patch(`/api/appointments/${encodeURIComponent(appointmentId)}`, payload);
                log('info', 'crm:appointments:update', {
                    ctx,
                    status,
                    id: data?.id,
                    new_slot: data?.slot_id,
                    ms: (performance.now() - t0).toFixed(1),
                });
                return data ?? null;
            } catch (error) {
                log('warn', 'crm:appointments:update:failed', {
                    ctx,
                    appointment_id: appointmentId,
                    status: error?.response?.status,
                    err: error?.message,
                    slot_id: slotId ?? null,
                    body:
                        error?.response?.data && typeof error.response.data === 'object'
                            ? JSON.stringify(error.response.data).slice(0, 800)
                            : undefined,
                });
                return { error: { status: error?.response?.status, body: error?.response?.data ?? null } };
            }
        },

        async cancel({ appointmentId }, ctx) {
            if (!http || !appointmentId) return false;
            const t0 = performance.now();
            try {
                const { status } = await http.delete(`/api/appointments/${encodeURIComponent(appointmentId)}`);
                log('info', 'crm:appointments:cancel', { ctx, appointment_id: appointmentId, status, ms: (performance.now() - t0).toFixed(1) });
                return true;
            } catch (error) {
                log('warn', 'crm:appointments:cancel:failed', {
                    ctx,
                    appointment_id: appointmentId,
                    status: error?.response?.status,
                    err: error?.message,
                });
                return { error: { status: error?.response?.status, body: error?.response?.data ?? null } };
            }
        },
    };
}
