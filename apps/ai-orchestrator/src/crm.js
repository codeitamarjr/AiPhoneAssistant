// src/crm.js
import axios from 'axios';

export function createCRMClient({ baseUrl, token, log = () => {} }) {
    const CRM_BASE_URL = String(baseUrl || '').replace(/\/$/, '');
    if (!CRM_BASE_URL) {
        log('warn', 'CRM_BASE_URL not set; CRM calls disabled');
    }

    const http =
        CRM_BASE_URL &&
        axios.create({
            baseURL: CRM_BASE_URL || undefined,
            timeout: 7000,
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

    // keep track of call_log ids keyed by Twilio/OpenAI call id
    const callLogIdBySid = new Map();

    async function fetchActiveListingByNumber(to_e164, ctx) {
        if (!http) return null;
        if (!to_e164) {
            log('warn', 'No dialed number found; skipping listing lookup', { ctx });
            return null;
        }
        const t0 = performance.now();
        try {
            const { data, status } = await http.get('/api/listings/by-number', { params: { to_e164 } });
            log('info', 'CRM listing lookup ok', {
                ctx,
                status,
                to_e164,
                ms: (performance.now() - t0).toFixed(1),
            });
            return data ?? null;
        } catch (e) {
            log('warn', 'CRM listing lookup failed', {
                ctx,
                to_e164,
                status: e?.response?.status,
                err: e?.message,
                ms: (performance.now() - t0).toFixed(1),
                body: e?.response?.data && typeof e.response.data === 'object' ? JSON.stringify(e.response.data).slice(0, 800) : undefined,
            });
            return null;
        }
    }

    async function logCallStart({ callId, from, to, ctx }) {
        if (!http) return;
        try {
            const { data } = await http.post('/api/calls/start', {
                twilio_call_sid: callId, // using OpenAI call_id as unique key
                from_e164: from,
                to_e164: to,
                caller_name: null,
                started_at: new Date().toISOString(),
                status: 'in-progress',
                meta: { source: 'openai-sip-webhook' },
            });
            const call_log_id = data?.id ?? null;
            if (call_log_id) callLogIdBySid.set(callId, call_log_id);
            log('debug', 'call start posted', { ctx, call_log_id });
        } catch (e) {
            log('warn', 'call start failed', { ctx, status: e?.response?.status, err: e?.message });
        }
    }

    async function logCallEnd({ callId, status = 'completed', durationSeconds = null, callerName = null, meta = {}, ctx }) {
        if (!CRM_BASE_URL) return;
        try {
            await http.post('/api/calls/end', {
                twilio_call_sid: callId,
                status,
                ended_at: new Date().toISOString(),
                duration_seconds: durationSeconds,
                caller_name: callerName,
                meta,
            });
            log('debug', 'call end posted', { ctx });
        } catch (e) {
            log('warn', 'call end failed', { ctx, status: e?.response?.status, err: e?.message });
        }
        callLogIdBySid.delete(callId);
    }

    async function createLead(payload, ctx) {
        if (!http) return null;
        const t0 = performance.now();
        try {
            const { data, status } = await http.post('/api/leads', payload);
            log('info', 'CRM lead created', { ctx, status, ms: (performance.now() - t0).toFixed(1), id: data?.id });
            return data ?? null;
        } catch (e) {
            log('warn', 'CRM lead create failed', {
                ctx,
                status: e?.response?.status,
                err: e?.message,
                body: e?.response?.data && typeof e.response.data === 'object' ? JSON.stringify(e.response.data).slice(0, 800) : undefined,
            });
            return null;
        }
    }

    // Convenience: build + post a lead tied to this call/listing if we have enough fields.
    async function postLeadForCall({ callId, listing, from, name = null, email = null, notes = null, status = 'new', ctx }) {
        const listing_id = listing?.id ?? null;
        const call_log_id = callLogIdBySid.get(callId) ?? null;
        if (!from) {
            log('info', 'lead skipped (no caller phone)', { ctx, callId });
            return null;
        }
        if (!call_log_id && !listing_id) {
            log('info', 'lead skipped (no call log or listing context available)', { ctx, callId });
            return null;
        }
        const payload = {
            listing_id,
            call_log_id,
            name: name || null,
            phone_e164: from,
            email: email || null,
            notes: notes || null,
            status, // 'new' | 'contacted' | 'qualified' | 'waitlist' | 'rejected'
        };
        return createLead(payload, ctx);
    }

    // --- Appointments API ---
    async function getNextSlot({ listing_id }, ctx) {
        if (!http || !listing_id) return null;
        const t0 = performance.now();
        try {
            const { data, status } = await http.get('/api/appointments/next', { params: { listing_id } });
            log('info', 'CRM next slot ok', { ctx, status, listing_id, ms: (performance.now() - t0).toFixed(1) });
            return data ?? null;
        } catch (e) {
            log('warn', 'CRM next slot failed', {
                ctx,
                listing_id,
                status: e?.response?.status,
                err: e?.message,
                body: e?.response?.data && typeof e.response.data === 'object' ? JSON.stringify(e.response.data).slice(0, 800) : undefined,
            });
            return { error: { status: e?.response?.status, body: e?.response?.data ?? null } };
        }
    }

    async function createAppointment({ viewing_slot_id, name, phone, email }, ctx) {
        if (!http || !viewing_slot_id) return null;
        const t0 = performance.now();
        try {
            const payload = { viewing_slot_id, name, phone, email };
            const { data, status } = await http.post('/api/appointments', payload);
            log('info', 'CRM appointment created', {
                ctx,
                status,
                id: data?.id,
                slot_id: data?.slot_id,
                ms: (performance.now() - t0).toFixed(1),
            });
            return data ?? null;
        } catch (e) {
            log('warn', 'CRM appointment create failed', {
                ctx,
                status: e?.response?.status,
                err: e?.message,
                body: e?.response?.data && typeof e.response.data === 'object' ? JSON.stringify(e.response.data).slice(0, 800) : undefined,
            });
            return { error: { status: e?.response?.status, body: e?.response?.data ?? null } };
        }
    }

    async function updateAppointment({ id, viewing_slot_id, name, phone, email }, ctx) {
        if (!http || !id) return null;
        const t0 = performance.now();
        try {
            const payload = {};
            if (viewing_slot_id != null) payload.viewing_slot_id = viewing_slot_id;
            if (name != null) payload.name = name;
            if (phone != null) payload.phone = phone;
            if (email != null) payload.email = email;

            const { data, status } = await http.patch(`/api/appointments/${encodeURIComponent(id)}`, payload);
            log('info', 'CRM appointment updated', {
                ctx,
                status,
                id: data?.id,
                new_slot: data?.slot_id,
                ms: (performance.now() - t0).toFixed(1),
            });
            return data ?? null;
        } catch (e) {
            log('warn', 'CRM appointment update failed', {
                ctx,
                id,
                status: e?.response?.status,
                err: e?.message,
                body: e?.response?.data && typeof e.response.data === 'object' ? JSON.stringify(e.response.data).slice(0, 800) : undefined,
            });
            return { error: { status: e?.response?.status, body: e?.response?.data ?? null } };
        }
    }

    async function cancelAppointment({ id }, ctx) {
        if (!http || !id) return false;
        const t0 = performance.now();
        try {
            const { status } = await http.delete(`/api/appointments/${encodeURIComponent(id)}`);
            log('info', 'CRM appointment canceled', { ctx, id, status, ms: (performance.now() - t0).toFixed(1) });
            return true;
        } catch (e) {
            log('warn', 'CRM appointment cancel failed', { ctx, id, status: e?.response?.status, err: e?.message });
            return { error: { status: e?.response?.status, body: e?.response?.data ?? null } };
        }
    }

    return {
        fetchActiveListingByNumber,
        logCallStart,
        logCallEnd,
        postLeadForCall,
        getNextSlot,
        createAppointment,
        updateAppointment,
        cancelAppointment,
    };
}
