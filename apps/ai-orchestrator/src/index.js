// src/index.js
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import crypto from 'crypto';
import { createCRMClient } from './crm.js';

const {
    PORT = 5050,
    OPENAI_API_KEY,
    OPENAI_WEBHOOK_SECRET,
    REALTIME_MODEL = 'gpt-realtime',
    REALTIME_VOICE = 'alloy',
    CRM_BASE_URL,
    CRM_TOKEN,
    LOG_LEVEL = 'debug', // debug|info|warn|error
} = process.env;

const callStartedAt = new Map();

// --- tiny structured logger ---
const levels = ['debug', 'info', 'warn', 'error'];
function logj(level, msg, obj = {}) {
    if (levels.indexOf(level) < levels.indexOf(LOG_LEVEL)) return;
    console.log(
        JSON.stringify({
            t: new Date().toISOString(),
            lvl: level.toUpperCase(),
            msg,
            ...obj,
        })
    );
}

if (!OPENAI_API_KEY || !OPENAI_WEBHOOK_SECRET) {
    logj('error', 'Missing OPENAI_API_KEY or OPENAI_WEBHOOK_SECRET – check .env');
    process.exit(1);
}

const app = express();
// Keep RAW body for OpenAI webhook signature verification
app.use(bodyParser.raw({ type: '*/*' }));

// --- CRM client ---
const crm = createCRMClient({
    baseUrl: CRM_BASE_URL,
    token: CRM_TOKEN,
    log: (level, msg, obj) => logj(level, msg, obj),
});

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    webhookSecret: OPENAI_WEBHOOK_SECRET,
});

// --- helpers ---
const headerVal = (sipHeaders, name) => sipHeaders?.find((h) => h?.name?.toLowerCase() === name.toLowerCase())?.value || '';

const extractE164 = (s) => {
    const m = String(s || '').match(/\+?\d{6,15}/);
    return m ? m[0] : null;
};

const extractE164FromSipUri = (sipUri) => {
    const m = String(sipUri || '').match(/sip:(\+?\d{6,15})@/i);
    return m ? m[1] : null;
};

function extractDialedE164FromHeaders(sipHeaders = [], from_e164 = null) {
    const get = (name) => headerVal(sipHeaders, name);

    // 1) Diversion: <sip:+35319128567@twilio.com>;reason=unconditional
    const diversion = get('Diversion');
    const divNum = extractE164(diversion);
    if (divNum && divNum !== from_e164) return divNum;

    // 2) Common vendor headers
    const candidates = ['X-Twilio-To', 'X-Twilio-Called-Number', 'X-Original-To', 'X-Called-Number', 'P-Called-Party-ID'];
    for (const name of candidates) {
        const val = get(name);
        if (!val) continue;
        const e164 = extractE164(val);
        if (e164 && e164 !== from_e164) return e164;
    }

    // 3) To: "sip:+353...@..."
    const toHeader = get('To');
    const ru = extractE164FromSipUri(toHeader);
    if (ru && ru !== from_e164) return ru;

    return null;
}

const yesNo = (b) => (b === true ? 'Yes' : b === false ? 'No' : '—');

function buildGreetingFromListing(listing) {
    const title = listing?.title?.trim();
    if (title) {
        return `Hi, Welcome to ${title}, I'm an AI Phone Assistant, how can I help you today?`;
    }
    // Fallback when no listing matched (safe + friendly).
    return `Hi, Welcome, I'm an AI Phone Assistant, how can I help you today?`;
}

function summariseAmenities(amenities) {
    if (!amenities) return null;
    const list = Object.entries(amenities)
        .filter(([, v]) => !!v)
        .map(([k]) => k.replace(/[-_]/g, ' '))
        .slice(0, 12);
    return list.length ? list.join(', ') : null;
}

function summarisePolicies(policies, key) {
    return policies?.[key] ?? policies?.policies?.[key] ?? null;
}

function summariseUnitLine(unit) {
    const parts = [];
    const label = unit.label || unit.identifier || (unit.bedrooms != null ? `${unit.bedrooms} bed` : `Unit ${unit.id}`);
    parts.push(label);

    if (unit.bedrooms != null || unit.bathrooms != null) {
        parts.push(`${unit.bedrooms ?? '—'} bed / ${unit.bathrooms ?? '—'} bath`);
    }

    if (unit.rent) {
        parts.push(`€${unit.rent}/month`);
    }

    if (unit.available_from) {
        parts.push(`from ${unit.available_from}`);
    }

    return `• ${parts.join(' · ')}`;
}

function buildPropertyFacts(listing) {
    if (!listing) {
        return 'No listing matched this dialed number. Ask for the property name or address and collect lead info.';
    }

    const {
        title,
        address,
        postcode,
        summary,
        amenities,
        policies,
        extra_info,
        inventory_scope: scope,
        building,
        unit,
        unit_type: unitType,
        collection,
        listing_details: legacyDetails,
    } = listing;

    const lines = [];

    lines.push(`Listing title: ${title ?? '—'}`);
    if (address) lines.push(`Address: ${address}${postcode ? ` (${postcode})` : ''}`);

    if (building) {
        lines.push(
            `Building: ${building.name ?? '—'}${building.address_line1 ? `, ${building.address_line1}` : ''}${
                building.city ? `, ${building.city}` : ''
            }`
        );
    }

    const amenityText = summariseAmenities(amenities ?? building?.amenities ?? unit?.amenities ?? unitType?.amenities);
    if (amenityText) {
        lines.push(`Key amenities: ${amenityText}`);
    }

    const viewingPolicy = summarisePolicies(policies, 'viewings');
    const applicationPolicy = summarisePolicies(policies, 'application');
    if (viewingPolicy) lines.push(`Viewing policy: ${viewingPolicy}`);
    if (applicationPolicy) lines.push(`Application info: ${applicationPolicy}`);

    if (extra_info?.location?.summary) {
        lines.push(`Neighbourhood: ${extra_info.location.summary}`);
    }

    const description = summary ?? extra_info?.location?.title ?? null;
    if (description) {
        const text = String(description);
        lines.push(`Summary: ${text.length > 600 ? `${text.slice(0, 600)}…` : text}`);
    }

    switch (scope) {
        case 'collection': {
            const info = collection ?? {};
            lines.push(`This listing markets ${info.unit_count ?? collection?.unit_variations?.length ?? 0} units in this building.`);

            if (info.rent_range?.min || info.rent_range?.max) {
                const { min, max } = info.rent_range;
                if (min && max && min !== max) {
                    lines.push(`Rent range: €${min}–€${max} per month depending on the unit.`);
                } else if (min || max) {
                    const rent = min ?? max;
                    lines.push(`Typical rent: €${rent} per month.`);
                }
            }

            if (info.availability) {
                lines.push(`Earliest availability: ${info.availability}.`);
            }

            const variations = info.unit_variations ?? [];
            if (variations.length) {
                lines.push('Inventory highlights:');
                variations.slice(0, 6).forEach((u) => lines.push(summariseUnitLine(u)));
            }
            break;
        }

        case 'unit': {
            const data = unit ?? {};
            lines.push('This call is for a specific unit.');
            lines.push(
                `Rent: €${data.rent ?? legacyDetails?.rent ?? listing.rent ?? '—'} / month, deposit €${
                    data.deposit ?? legacyDetails?.deposit ?? listing.deposit ?? '—'
                }.`
            );
            if (data.available_from || legacyDetails?.available_from || listing.available_from) {
                lines.push(`Available from: ${data.available_from ?? legacyDetails?.available_from ?? listing.available_from ?? '—'}.`);
            }
            lines.push(
                `Beds/Baths: ${data.bedrooms ?? legacyDetails?.bedrooms ?? listing.bedrooms ?? '—'} / ${
                    data.bathrooms ?? legacyDetails?.bathrooms ?? listing.bathrooms ?? '—'
                }.`
            );
            break;
        }

        case 'unit_type': {
            const data = unitType ?? {};
            lines.push(`This listing covers the "${data.name ?? 'unit type'}" template.`);
            if (data.description) lines.push(`Description: ${data.description}`);
            if (data.default_rent) lines.push(`Typical monthly rent: €${data.default_rent}.`);
            if (data.min_lease_months) lines.push(`Minimum lease: ${data.min_lease_months} months.`);

            const examples = (collection?.unit_variations ?? []).slice(0, 5);
            if (examples.length) {
                lines.push('Example units currently available:');
                examples.forEach((u) => lines.push(summariseUnitLine(u)));
            }
            break;
        }

        default: {
            const d = legacyDetails ?? listing;
            lines.push(
                `Rent: €${d.rent ?? '—'} / month, deposit €${d.deposit ?? '—'}, available from ${d.available_from ?? '—'}, minimum lease ${
                    d.min_lease_months ?? '—'
                } months.`
            );
            lines.push(
                `Beds/Baths: ${d.bedrooms ?? '—'} / ${d.bathrooms ?? '—'}, floor area ${d.floor_area_sqm ?? '—'} sqm, BER ${d.ber ?? '—'}.`
            );
            lines.push(`Furnished: ${yesNo(d.furnished)} | Pets: ${yesNo(d.pets_allowed)} | Smoking: ${yesNo(d.smoking_allowed)}`);
            break;
        }
    }

    return lines.filter(Boolean).join('\n');
}

// Health check
app.get('/', (_req, res) =>
    res.json({
        ok: true,
        service: 'ai-orchestrator',
        time: new Date().toISOString(),
    })
);

// Avoid re-accept / re-WS for duplicates
const seenCalls = new Set();

/**
 * Attach a WS to the accepted SIP session with small delay & backoff.
 */
async function connectRealtimeWS({ callId, ctx, listing, greeting, fromCaller = null, initialDelayMs = 800, maxAttempts = 8 }) {
    const { default: WebSocket } = await import('ws');
    // accumulate streaming function-call args by item_id
    const fnArgBuffers = new Map(); // item_id -> { name, chunks: [] }

    let attempt = 0;
    let delay = initialDelayMs;

    return new Promise((resolve) => {
        const tryConnect = () => {
            attempt += 1;
            const wssUrl = `wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`;
            logj('info', 'ws:connecting', { ctx, callId, attempt, wssUrl });

            const ws = new WebSocket(wssUrl, {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    Origin: 'https://api.openai.com',
                },
                perMessageDeflate: false,
            });

            let opened = false;

            ws.on('open', async () => {
                opened = true;
                logj('info', 'ws:open', { ctx, callId, attempt });
                const resolvedGreeting = greeting ?? buildGreetingFromListing(listing);

                await new Promise((r) => setTimeout(r, 2000)); // 2 second pause

                ws.send(
                    JSON.stringify({
                        type: 'response.create',
                        response: { instructions: resolvedGreeting },
                    })
                );

                ws.send(
                    JSON.stringify({
                        type: 'conversation.item.create',
                        item: {
                            type: 'message',
                            role: 'system',
                            content: [{ type: 'input_text', text: `CURRENT_LISTING_ID=${listing?.id ?? ''}` }],
                        },
                    })
                );
                resolve(undefined);
            });

            ws.on('message', async (data) => {
                let msg;
                try {
                    msg = JSON.parse(data.toString());
                } catch {
                    return;
                }

                if (msg.type !== 'response.audio.delta') {
                    // logj('debug', 'ws:event', { ctx, callId, type: msg.type });
                }

                // Streamed function-call args
                if (msg.type === 'response.function_call_arguments.delta') {
                    const { item_id, name, arguments: argsChunk } = msg;
                    const entry = fnArgBuffers.get(item_id) || { name, chunks: [] };
                    if (name) entry.name = name;
                    if (argsChunk) entry.chunks.push(argsChunk);
                    fnArgBuffers.set(item_id, entry);
                }

                // Finalized arguments
                if (msg.type === 'response.function_call_arguments.done') {
                    const { item_id, name: doneName, arguments: doneArgs } = msg;
                    let fnName = doneName;
                    let full = doneArgs;
                    const entry = fnArgBuffers.get(item_id);
                    if ((!fnName || !full) && entry) {
                        fnName = fnName || entry.name;
                        full = full || (entry.chunks || []).join('');
                        fnArgBuffers.delete(item_id);
                    }
                    if (!fnName) {
                        logj('warn', 'fncall:missing-name', { ctx, callId, item_id });
                        return;
                    }

                    const args = JSON.parse(full || '{}');
                    const normPhone = (raw) => extractE164(raw);

                    if (fnName === 'save_lead') {
                        try {
                            const providedPhone = normPhone(args.phone_e164);
                            const phone = providedPhone || normPhone(fromCaller);
                            if (!phone) {
                                logj('warn', 'lead:missing-or-bad-phone', { ctx, callId, raw: args.phone_e164 });
                                return;
                            }
                            await crm.postLeadForCall({
                                callId,
                                listing,
                                from: phone,
                                name: args.name || null,
                                email: args.email || null,
                                notes: args.notes || null,
                                status: args.status || 'new',
                                ctx,
                            });
                            logj('info', 'lead:created', {
                                ctx,
                                callId,
                                phone_e164: phone,
                                hasNotes: !!args.notes,
                                status: args.status || 'new',
                            });
                        } catch (e) {
                            logj('error', 'lead:create:failed', { ctx, callId, err: String(e?.message || e) });
                        }
                    }

                    if (fnName === 'get_next_slot') {
                        const listing_id = Number(args.listing_id ?? listing?.id ?? null);
                        if (!listing_id) return;
                        const data = await crm.getNextSlot({ listing_id }, ctx);
                        if (data?.scheduled_at) {
                            ws.send(
                                JSON.stringify({
                                    type: 'response.create',
                                    response: {
                                        instructions: `The next viewing has availability between ${data.available_from} and ${data.available_until}.`,
                                    },
                                })
                            );
                        }
                        return;
                    }

                    if (fnName === 'create_appointment') {
                        const viewing_slot_id = Number(args.viewing_slot_id);
                        const name = String(args.name || '').trim() || null;
                        const phone = normPhone(args.phone) || normPhone(fromCaller);
                        const email = args.email ? String(args.email).trim() : null;

                        if (!viewing_slot_id || !name || !phone) {
                            logj('warn', 'appt:create:missing-fields', {
                                ctx,
                                callId,
                                viewing_slot_id,
                                hasName: !!name,
                                hasPhone: !!phone,
                            });
                            return;
                        }

                        const appt = await crm.createAppointment({ viewing_slot_id, name, phone, email }, ctx);
                        if (appt?.id) {
                            ws.send(
                                JSON.stringify({
                                    type: 'response.create',
                                    response: {
                                        instructions: `All set, your viewing is scheduled for ${appt.scheduled_at}. Your reference number is ${appt.id}.`,
                                    },
                                })
                            );
                        }

                        // Graceful recovery on capacity/invalid slot
                        if (appt?.error?.status === 422) {
                            const next = await crm.getNextSlot({ listing_id: listing?.id }, ctx);
                            const windowTxt =
                                next?.available_from && next?.available_until
                                    ? `between ${next.available_from} and ${next.available_until}`
                                    : 'soon';
                            ws.send(
                                JSON.stringify({
                                    type: 'response.create',
                                    response: {
                                        instructions: `Looks like that time just filled. The next availability is ${windowTxt}. Which time works for you?`,
                                    },
                                })
                            );
                            return;
                        }

                        // Generic failure
                        ws.send(
                            JSON.stringify({
                                type: 'response.create',
                                response: {
                                    instructions: `Sorry—something went wrong booking that slot. Want me to check the next available time?`,
                                },
                            })
                        );

                        return;
                    }

                    if (fnName === 'update_appointment') {
                        const appointment_id = Number(args.appointment_id);
                        const viewing_slot_id = args.viewing_slot_id != null ? Number(args.viewing_slot_id) : undefined;
                        const name = args.name != null ? String(args.name).trim() : undefined;
                        const phone = args.phone != null ? normPhone(args.phone) : undefined;
                        const email = args.email != null ? String(args.email).trim() : undefined;

                        if (!appointment_id) {
                            logj('warn', 'appt:update:missing-id', { ctx, callId });
                            return;
                        }

                        const appt = await crm.updateAppointment({ id: appointment_id, viewing_slot_id, name, phone, email }, ctx);
                        if (appt?.id) {
                            ws.send(
                                JSON.stringify({
                                    type: 'response.create',
                                    response: {
                                        instructions: `Updated. Your viewing is now scheduled for ${appt.scheduled_at}.`,
                                    },
                                })
                            );
                        }
                        return;
                    }

                    if (fnName === 'cancel_appointment') {
                        const appointment_id = Number(args.appointment_id);
                        if (!appointment_id) {
                            logj('warn', 'appt:cancel:missing-id', { ctx, callId });
                            return;
                        }
                        const ok = await crm.cancelAppointment({ id: appointment_id }, ctx);
                        if (ok) {
                            ws.send(
                                JSON.stringify({
                                    type: 'response.create',
                                    response: { instructions: `Your appointment ${appointment_id} has been canceled.` },
                                })
                            );
                        }
                        return;
                    }
                }

                if (msg.type.startsWith('response.function_call_arguments')) {
                    logj('debug', 'fncall:event', {
                        ctx,
                        callId,
                        type: msg.type,
                        name: msg.name,
                        sample: String(msg.arguments || '').slice(0, 200),
                    });
                }
            });

            ws.on('error', (e) => logj('warn', 'ws:error', { ctx, callId, attempt, err: e?.message }));

            ws.on('close', (code, reason) => {
                const isFinalClose = opened || attempt >= maxAttempts;

                logj('info', 'ws:close', {
                    ctx,
                    callId,
                    attempt,
                    code,
                    reason: reason?.toString() || '',
                    opened,
                    isFinalClose,
                });

                if (isFinalClose) {
                    const started = callStartedAt.get(callId);
                    const durationSeconds = started ? Math.max(0, Math.round((Date.now() - started) / 1000)) : null;
                    callStartedAt.delete(callId);
                    const finalStatus = opened ? 'completed' : code === 1000 ? 'completed' : 'failed';
                    crm.logCallEnd({ callId, status: finalStatus, durationSeconds, ctx }).catch(() => {});
                }

                // Only retry if we never opened and still have attempts left
                if (!opened && attempt < maxAttempts) {
                    setTimeout(tryConnect, delay);
                    delay = Math.min(delay * 2, 2000);
                }
            });
        };

        setTimeout(tryConnect, initialDelayMs);
    });
}

// Webhook entrypoint
app.post('/webhook', async (req, res) => {
    const ctx = crypto.randomUUID();
    const t0 = process.hrtime.bigint();
    const sig = req.headers['webhook-signature'];

    logj('info', 'webhook:received', {
        ctx,
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        'body-bytes': req.body?.length ?? 0,
        'webhook-id': req.headers['webhook-id'],
        'webhook-timestamp': req.headers['webhook-timestamp'],
        'has-signature': Boolean(sig),
    });

    try {
        const unwrapT0 = process.hrtime.bigint();
        const event = await openai.webhooks.unwrap(req.body, req.headers);
        const unwrapMs = Number(process.hrtime.bigint() - unwrapT0) / 1e6;
        logj('debug', 'webhook:unwrapped', {
            ctx,
            event_type: event?.type,
            unwrap_ms: unwrapMs.toFixed(1),
        });

        if (event?.type === 'realtime.call.incoming') {
            const callId = event?.data?.call_id;
            const fromH = headerVal(event?.data?.sip_headers, 'From');
            const toH = headerVal(event?.data?.sip_headers, 'To');
            const from_e164 = extractE164(fromH);

            // Diagnostics
            const dbg = {
                to: toH,
                x_twilio_to: headerVal(event?.data?.sip_headers, 'X-Twilio-To'),
                x_twilio_called_number: headerVal(event?.data?.sip_headers, 'X-Twilio-Called-Number'),
                x_original_to: headerVal(event?.data?.sip_headers, 'X-Original-To'),
                x_called_number: headerVal(event?.data?.sip_headers, 'X-Called-Number'),
                p_called_party_id: headerVal(event?.data?.sip_headers, 'P-Called-Party-ID'),
                p_asserted_identity: headerVal(event?.data?.sip_headers, 'P-Asserted-Identity'),
                diversion: headerVal(event?.data?.sip_headers, 'Diversion'),
            };
            logj('debug', 'sip:headers:summary', { ctx, ...dbg });

            // Determine dialed DID (prefer Diversion)
            let dialed_e164 = extractDialedE164FromHeaders(event?.data?.sip_headers, from_e164);
            logj('info', 'dialed:detected', { ctx, dialed_e164 });

            logj('info', 'call:incoming', {
                ctx,
                callId,
                fromHeader: fromH,
                toHeader: toH,
                from_e164,
                dialed_e164,
            });

            // ignore duplicates
            if (seenCalls.has(callId)) {
                logj('debug', 'call:duplicate-webhook', { ctx, callId });
                res.set('Authorization', `Bearer ${OPENAI_API_KEY}`);
                return res.sendStatus(200);
            }
            seenCalls.add(callId);

            // CRM listing lookup by dialed DID
            const listing = await crm.fetchActiveListingByNumber(dialed_e164, ctx);
            const facts = buildPropertyFacts(listing);
            const openingGreeting = buildGreetingFromListing(listing);

            const instructions = `
            You are an AI lettings assistant. Start in English.

            - First line (verbatim): "${openingGreeting}"
            - Confirm you’re the property assistant.
            - Use the Property facts below; if unknown, say so.
            - If caller is interested, you can either:
            • Take details for a callback (use \`save_lead\` once), or
            • Offer to book a viewing now.
            - When booking:
            1) If caller asks “when is the next one?”, call \`get_next_slot\` with the current listing_id.
            2) Collect full name and confirm the phone in E.164 (+353…).
            3) Ask for email (optional).
            4) Ask which time/slot they prefer from the available window.
            5) Call \`create_appointment\` once with viewing_slot_id, name, phone, email.
            - Reschedules: confirm the new slot then call \`update_appointment\`.
            - Cancellations: confirm the appointment id and call \`cancel_appointment\`.
            - Only call tools with real, user-provided data (no placeholders).
            - Never invent availability, fees, or facts. Keep answers concise and friendly.
            - If asked for your name, say: "I'm the AI lettings assistant".
            
            Property facts:
            ${facts}`.trim();

            // 1) Accept the call
            const accT0 = process.hrtime.bigint();
            const resp = await fetch(`https://api.openai.com/v1/realtime/calls/${encodeURIComponent(callId)}/accept`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'realtime',
                    model: REALTIME_MODEL,
                    instructions,
                    tools: [
                        {
                            type: 'function',
                            name: 'save_lead',
                            description: 'Create a CRM lead once caller details are captured.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', nullable: true, description: 'Full name of the caller' },
                                    phone_e164: { type: 'string', nullable: false, description: 'Callback number in E.164 (e.g. 353...)' },
                                    email: { type: 'string', nullable: true, description: 'Email address (optional)' },
                                    notes: {
                                        type: 'string',
                                        nullable: true,
                                        description: 'Short notes: move-in date, pets, parking, budget, etc.',
                                    },
                                    status: {
                                        type: 'string',
                                        nullable: true,
                                        enum: ['new', 'contacted', 'qualified', 'waitlist', 'rejected'],
                                        description: "Lead status; default 'new' if omitted.",
                                    },
                                },
                                required: ['phone_e164'],
                            },
                        },
                        {
                            type: 'function',
                            name: 'get_next_slot',
                            description: 'Fetch the next available viewing slot for the current listing.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    listing_id: { type: 'integer', nullable: false, description: 'Listing ID to check availability for' },
                                },
                                required: ['listing_id'],
                            },
                        },
                        {
                            type: 'function',
                            name: 'create_appointment',
                            description: 'Create a viewing appointment in a specific slot.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    viewing_slot_id: { type: 'integer', nullable: false, description: 'Viewing slot ID (e.g. 17)' },
                                    name: { type: 'string', nullable: false, description: 'Full name' },
                                    phone: { type: 'string', nullable: false, description: 'E.164 phone (e.g. +353...)' },
                                    email: { type: 'string', nullable: true, description: 'Email (optional)' },
                                },
                                required: ['viewing_slot_id', 'name', 'phone'],
                            },
                        },
                        {
                            type: 'function',
                            name: 'update_appointment',
                            description: 'Reschedule or change contact info for an existing appointment.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    appointment_id: { type: 'integer', nullable: false, description: 'Appointment ID to modify' },
                                    viewing_slot_id: { type: 'integer', nullable: true, description: 'New slot ID' },
                                    name: { type: 'string', nullable: true },
                                    phone: { type: 'string', nullable: true, description: 'E.164 phone' },
                                    email: { type: 'string', nullable: true },
                                },
                                required: ['appointment_id'],
                            },
                        },
                        {
                            type: 'function',
                            name: 'cancel_appointment',
                            description: 'Cancel a previously created appointment.',
                            parameters: {
                                type: 'object',
                                properties: {
                                    appointment_id: { type: 'integer', nullable: false, description: 'Appointment ID to cancel' },
                                },
                                required: ['appointment_id'],
                            },
                        },
                    ],
                    audio: { output: { voice: REALTIME_VOICE } },
                }),
            });
            const acceptMs = Number(process.hrtime.bigint() - accT0) / 1e6;

            if (!resp.ok) {
                const text = await resp.text().catch(() => '');
                logj('error', 'accept:failed', {
                    ctx,
                    callId,
                    status: resp.status,
                    accept_ms: acceptMs.toFixed(1),
                    body: text?.slice(0, 2000),
                });
                return res.status(500).send('Accept failed');
            }
            logj('info', 'accept:ok', {
                ctx,
                callId,
                status: resp.status,
                accept_ms: acceptMs.toFixed(1),
            });
            callStartedAt.set(callId, Date.now());

            // 2) Non-blocking call log start
            crm.logCallStart({ callId, from: from_e164, to: dialed_e164, listing, ctx }).catch(() => {});

            // 3) ACK the webhook
            res.set('Authorization', `Bearer ${OPENAI_API_KEY}`);
            res.sendStatus(200);

            // 4) Optional WS attach
            try {
                await connectRealtimeWS({
                    callId,
                    ctx,
                    listing,
                    greeting: openingGreeting,
                    fromCaller: from_e164,
                    initialDelayMs: 800,
                    maxAttempts: 8,
                });
            } catch (e) {
                logj('warn', 'ws:attach-failed', {
                    ctx,
                    callId,
                    err: String(e?.message || e),
                });
            }

            const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
            logj('debug', 'webhook:done', { ctx, total_ms: totalMs.toFixed(1) });
            return;
        }

        // Mark completed when OpenAI tells us the call ended.
        if (event?.type === 'realtime.call.ended') {
            const callId = event?.data?.call_id;
            const started = callStartedAt.get(callId);
            const durationSeconds = started ? Math.max(0, Math.round((Date.now() - started) / 1000)) : null;
            callStartedAt.delete(callId);

            logj('info', 'call:ended (webhook)', { ctx, callId, durationSeconds, cause: event?.data?.cause });
            await crm.logCallEnd({
                callId,
                status: 'completed',
                durationSeconds,
                meta: { source: 'openai-sip-webhook', cause: event?.data?.cause },
                ctx,
            });
            res.sendStatus(200);
            return;
        }

        // Other events
        res.sendStatus(200);
        const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
        logj('debug', 'webhook:ignored-event', {
            ctx,
            event_type: event?.type,
            total_ms: totalMs.toFixed(1),
        });
    } catch (err) {
        const msg = String(err?.message ?? err);
        const isSigErr = err?.name === 'InvalidWebhookSignatureError' || msg.toLowerCase().includes('invalid signature');
        logj(isSigErr ? 'warn' : 'error', 'webhook:error', {
            ctx,
            err: msg,
            name: err?.name,
            stack: err?.stack?.split('\n').slice(0, 3).join(' | '),
        });
        return res.status(isSigErr ? 400 : 500).send(isSigErr ? 'Invalid signature' : 'Server error');
    }
});

process.on('unhandledRejection', (r) => logj('error', 'unhandledRejection', { reason: String(r) }));
process.on('uncaughtException', (e) => logj('error', 'uncaughtException', { err: String(e) }));

app.listen(Number(PORT), () => logj('info', 'orchestrator:listening', { url: `http://localhost:${PORT}` }));
