// src/orchestrator.js
import crypto from 'crypto';
import OpenAI from 'openai';
import { buildGreetingFromListing, buildPropertyFacts } from './utils/prompts.js';
import { headerVal, extractE164, extractDialedE164FromHeaders } from './utils/telephony.js';

const assistantTools = [
    {
        type: 'function',
        name: 'save_lead',
        description: 'Create a CRM lead once caller details are captured.',
        parameters: {
            type: 'object',
            properties: {
                name: { type: 'string', nullable: true, description: 'Full name of the caller' },
                phone_e164: { type: 'string', nullable: false, description: 'Callback number (international format preferred, e.g. +353...)' },
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
        name: 'find_appointment',
        description: 'Look up an existing appointment by caller phone (optionally scoped to a listing).',
        parameters: {
            type: 'object',
            properties: {
                phone: { type: 'string', nullable: false, description: 'Caller phone number (AI should normalise to international format)' },
                listing_id: {
                    type: 'integer',
                    nullable: true,
                    description: 'Listing ID to narrow the search if known',
                },
            },
            required: ['phone'],
        },
    },
    {
        type: 'function',
        name: 'get_appointment',
        description: 'Fetch detailed information for an appointment by its reference ID.',
        parameters: {
            type: 'object',
            properties: {
                appointment_id: { type: 'integer', nullable: false, description: 'Appointment reference ID' },
            },
            required: ['appointment_id'],
        },
    },
    {
        type: 'function',
        name: 'create_appointment',
        description: 'Create a viewing appointment in a specific slot.',
        parameters: {
            type: 'object',
            properties: {
                viewing_slot_id: {
                    type: 'integer',
                    nullable: true,
                    description: 'Viewing slot ID (e.g. 17). Provide this or slot_id.',
                },
                slot_id: {
                    type: 'integer',
                    nullable: true,
                    description: 'Alias for viewing_slot_id accepted by the CRM API.',
                },
                name: { type: 'string', nullable: false, description: 'Full name' },
                phone: { type: 'string', nullable: false, description: 'Caller phone number (return in international format, e.g. +353...)' },
                email: { type: 'string', nullable: true, description: 'Email (optional)' },
            },
            required: ['name', 'phone'],
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
                viewing_slot_id: {
                    type: 'integer',
                    nullable: true,
                    description: 'New viewing slot ID; provide this or slot_id.',
                },
                slot_id: {
                    type: 'integer',
                    nullable: true,
                    description: 'Alias for viewing_slot_id accepted by the CRM API.',
                },
                name: { type: 'string', nullable: true },
                phone: { type: 'string', nullable: true, description: 'Optional phone number (international format preferred)' },
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
];

function buildAssistantInstructions({ greeting, propertyFacts }) {
    return `
You are the building's lettings receptionist. Stay professional and friendly.

- First sentence must be exactly: "${greeting}" (no words before it)
- Confirm you're the property assistant.
- Only discuss the property, viewings, pricing, amenities, policies, and booking logistics. If the caller requests anything unrelated (e.g. jokes, chit-chat, other topics), politely decline and remind them you can only help with questions about the property.
- Use the Property facts below; if something is unknown, say so. Never invent, embellish, or contradict these facts.
- If caller is interested, you can either:
• Take details for a callback (use \`save_lead\` once), or
• Offer to book a viewing now.
- When booking:
1) If caller asks “when is the next one?”, call \`get_next_slot\` with the current listing_id.
2) Collect full name and confirm the contact phone number, repeating it back in international format (e.g. +353… or whichever country the caller specifies).
3) Ask for email (optional).
4) Ask which time/slot they prefer from the available window.
5) Call \`create_appointment\` once with the chosen slot id (use viewing_slot_id or slot_id), name, phone, email.
- When presenting availability from \`get_next_slot\`, quote the exact scheduled time (e.g. “There’s a slot at 10:50am”) so the caller knows what will be booked.
- When modifying existing bookings, first call \`find_appointment\` (requires the caller's phone and optional listing_id) or \`get_appointment\` if they provide the reference number. Confirm details with the caller before proceeding.
- Reschedules: confirm the new slot then call \`update_appointment\`.
- Cancellations: confirm the appointment id and call \`cancel_appointment\`.
- Only call tools with real, user-provided data (no placeholders).
- If asked for your name, say: "I'm the AI lettings assistant".

Property facts:
${propertyFacts}`.trim();
}

function formatAppointmentWhen(appointment) {
    const iso = appointment?.scheduled_at ?? appointment?.slot?.start_at ?? null;
    if (!iso) return 'an unscheduled time';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleString('en-IE', { dateStyle: 'medium', timeStyle: 'short' });
}

function describeAppointment(appointment) {
    if (!appointment) return 'No appointment details available.';
    const when = formatAppointmentWhen(appointment);
    const name = appointment?.name ? appointment.name : 'the caller';
    const listingTitle =
        appointment?.listing?.title ?? appointment?.slot?.listing?.title ?? appointment?.listing_title ?? null;
    const listingPart = listingTitle ? ` for ${listingTitle}` : '';
    return `Appointment ${appointment.id ?? ''}${listingPart} is scheduled for ${when} with ${name}.`;
}

function appointmentSnapshot(appointment) {
    if (!appointment || typeof appointment !== 'object') return {};
    const base = {
        id: appointment.id ?? null,
        listing_id: appointment.listing_id ?? null,
        slot_id: appointment.slot_id ?? appointment.viewing_slot_id ?? null,
        name: appointment.name ?? null,
        phone: appointment.phone ?? null,
        email: appointment.email ?? null,
        scheduled_at: appointment.scheduled_at ?? null,
    };
    if (appointment.slot) {
        base.slot = {
            id: appointment.slot.id ?? null,
            start_at: appointment.slot.start_at ?? null,
            mode: appointment.slot.mode ?? null,
        };
    }
    if (appointment.listing) {
        base.listing = {
            id: appointment.listing.id ?? null,
            title: appointment.listing.title ?? null,
        };
    } else if (appointment.slot?.listing) {
        base.listing = {
            id: appointment.slot.listing.id ?? null,
            title: appointment.slot.listing.title ?? null,
        };
    }
    return base;
}

function createCallStateStore() {
    const store = new Map();

    const ensure = (callId) => {
        if (!store.has(callId)) {
            store.set(callId, {
                startedAt: null,
                callLogId: null,
                lastSlotId: null,
                lastAppointment: null,
            });
        }
        return store.get(callId);
    };

    return {
        setStartedAt(callId, timestamp) {
            ensure(callId).startedAt = timestamp;
        },
        getStartedAt(callId) {
            return store.get(callId)?.startedAt ?? null;
        },
        setCallLogId(callId, callLogId) {
            ensure(callId).callLogId = callLogId ?? null;
        },
        getCallLogId(callId) {
            return store.get(callId)?.callLogId ?? null;
        },
        setLastSlotId(callId, slotId) {
            ensure(callId).lastSlotId = slotId ?? null;
        },
        getLastSlotId(callId) {
            return store.get(callId)?.lastSlotId ?? null;
        },
        setLastAppointment(callId, appointment) {
            const entry = ensure(callId);
            entry.lastAppointment = appointment ?? null;
            const slotId = appointment?.slot_id ?? appointment?.viewing_slot_id ?? null;
            if (slotId != null) {
                const num = Number(slotId);
                if (Number.isFinite(num) && num > 0) {
                    entry.lastSlotId = num;
                }
            }
        },
        getLastAppointment(callId) {
            return store.get(callId)?.lastAppointment ?? null;
        },
        clear(callId) {
            store.delete(callId);
        },
        clearLastSlotId(callId) {
            const entry = store.get(callId);
            if (entry) entry.lastSlotId = null;
        },
        clearLastAppointment(callId) {
            const entry = store.get(callId);
            if (entry) entry.lastAppointment = null;
        },
    };
}

function createRealtimeSessionConnector({ config, log, crm, callState, seenCalls }) {
    return async function connectRealtimeSession({
        callId,
        ctx,
        listing,
        greeting,
        fromCaller = null,
        initialDelayMs = 800,
        maxAttempts = 8,
    }) {
        const { default: WebSocket } = await import('ws');
        const fnArgBuffers = new Map(); // item_id -> { name, chunks: [] }

        let attempt = 0;
        let delay = initialDelayMs;

        return new Promise((resolve) => {
            const tryConnect = () => {
                attempt += 1;
                const wssUrl = `wss://api.openai.com/v1/realtime?call_id=${encodeURIComponent(callId)}`;
                log('info', 'ws:connecting', { ctx, callId, attempt, wssUrl });

                const ws = new WebSocket(wssUrl, {
                    headers: {
                        Authorization: `Bearer ${config.openaiApiKey}`,
                        Origin: 'https://api.openai.com',
                    },
                    perMessageDeflate: false,
                });

                let opened = false;

                ws.on('open', async () => {
                    opened = true;
                    log('info', 'ws:open', { ctx, callId, attempt });
                    const resolvedGreeting = greeting ?? buildGreetingFromListing(listing);

                    await new Promise((r) => setTimeout(r, 2000)); // small pause before speaking

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

                ws.on('message', async (raw) => {
                    let msg;
                    try {
                        msg = JSON.parse(raw.toString());
                    } catch {
                        return;
                    }

                    if (msg.type === 'response.function_call_arguments.delta') {
                        const { item_id, name, arguments: argsChunk } = msg;
                        const entry = fnArgBuffers.get(item_id) || { name, chunks: [] };
                        if (name) entry.name = name;
                        if (argsChunk) entry.chunks.push(argsChunk);
                        fnArgBuffers.set(item_id, entry);
                    }

                    if (msg.type === 'response.function_call_arguments.done') {
                        const { item_id, name: doneName, arguments: doneArgs } = msg;
                        let fnName = doneName;
                        let fullArgs = doneArgs;
                        const entry = fnArgBuffers.get(item_id);
                        if ((!fnName || !fullArgs) && entry) {
                            fnName = fnName || entry.name;
                            fullArgs = fullArgs || (entry.chunks || []).join('');
                            fnArgBuffers.delete(item_id);
                        }
                        if (!fnName) {
                            log('warn', 'fncall:missing-name', { ctx, callId, item_id });
                            return;
                        }

                        const args = JSON.parse(fullArgs || '{}');
                        const normalizePhone = (rawPhone) => extractE164(rawPhone);

                        if (fnName === 'save_lead') {
                            try {
                        const providedPhone =
                            normalizePhone(args.phone_e164)
                            || normalizePhone(args.phone)
                            || normalizePhone(args.phone_number);
                                const phone = providedPhone || normalizePhone(fromCaller);
                                if (!phone) {
                                    log('warn', 'lead:missing-or-bad-phone', { ctx, callId, raw: args.phone_e164 });
                                    return;
                                }

                                const callLogId = callState.getCallLogId(callId);
                                await crm.leads.createForCall({
                                    callLogId,
                                    listingId: listing?.id ?? null,
                                    from: phone,
                                    name: args.name || null,
                                    email: args.email || null,
                                    notes: args.notes || null,
                                    status: args.status || 'new',
                                    ctx,
                                });
                                log('info', 'lead:created', {
                                    ctx,
                                    callId,
                                    phone_e164: phone,
                                    hasNotes: !!args.notes,
                                    status: args.status || 'new',
                                });

                                const confirmation = args?.name
                                    ? `Thanks ${args.name}! I've logged your details and someone will follow up shortly.`
                                    : 'Thanks! I’ve taken your details and the team will be in touch soon.';

                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions: confirmation,
                                        },
                                    })
                                );
                            } catch (error) {
                                log('error', 'lead:create:failed', { ctx, callId, err: String(error?.message || error) });
                            }
                            return;
                        }

                        if (fnName === 'get_next_slot') {
                            const listingId = Number(args.listing_id ?? listing?.id ?? null);
                            if (!listingId) return;
                            const slotData = await crm.appointments.getNextSlot({ listingId }, ctx);
                            if (slotData?.scheduled_at) {
                                const rawSlotId = slotData?.viewing_slot_id ?? slotData?.slot_id ?? slotData?.id ?? null;
                                const slotId = Number(rawSlotId);
                                if (Number.isFinite(slotId) && slotId > 0) {
                                    callState.setLastSlotId(callId, slotId);
                                    ws.send(
                                        JSON.stringify({
                                            type: 'conversation.item.create',
                                            item: {
                                                type: 'message',
                                                role: 'system',
                                                content: [
                                                    {
                                                        type: 'input_text',
                                                        text: `NEXT_SLOT_ID=${slotId}`,
                                                    },
                                                ],
                                            },
                                        })
                                    );
                                }

                                const scheduledAt = slotData.scheduled_at;
                                const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
                                const formattedTime = scheduledDate && !Number.isNaN(scheduledDate.getTime())
                                    ? scheduledDate.toLocaleString('en-IE', { dateStyle: 'medium', timeStyle: 'short' })
                                    : scheduledAt;

                                let instructions = formattedTime
                                    ? `The next available viewing slot is at ${formattedTime}.`
                                    : 'A viewing slot is available.';

                                if (slotData.mode === 'open' && slotData.available_from && slotData.available_until) {
                                    instructions += ` The window for this slot runs from ${slotData.available_from} to ${slotData.available_until}.`;
                                }

                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions,
                                        },
                                    })
                                );
                            }
                            return;
                        }

                        if (fnName === 'find_appointment') {
                            const rawPhone = args.phone ?? args.phone_e164 ?? null;
                            const phone = normalizePhone(rawPhone) || normalizePhone(fromCaller);
                            const listingIdRaw = args.listing_id;
                            const listingIdCandidate =
                                listingIdRaw != null && listingIdRaw !== ''
                                    ? Number(listingIdRaw)
                                    : listing?.id ?? null;
                            const listingIdNumber =
                                listingIdCandidate != null && Number.isFinite(Number(listingIdCandidate))
                                    ? Number(listingIdCandidate)
                                    : null;

                            if (!phone) {
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions:
                                                "I didn't catch the phone number on the booking. Could you read it out so I can look it up?",
                                        },
                                    })
                                );
                                return;
                            }

                            const lookup = await crm.appointments.lookupByPhone(
                                { phone, listingId: listingIdNumber },
                                ctx
                            );

                            if (lookup?.error) {
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions:
                                                "Something went wrong while checking that booking. Could we double-check the details or try again in a moment?",
                                        },
                                    })
                                );
                                return;
                            }

                            if (!lookup) {
                                callState.clearLastAppointment(callId);
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions:
                                                "I couldn't find an existing appointment for that number. Would you like me to book one?",
                                        },
                                    })
                                );
                                return;
                            }

                            callState.setLastAppointment(callId, lookup);

                            const snapshot = appointmentSnapshot(lookup);
                            ws.send(
                                JSON.stringify({
                                    type: 'conversation.item.create',
                                    item: {
                                        type: 'message',
                                        role: 'system',
                                        content: [
                                            {
                                                type: 'input_text',
                                                text: `FOUND_APPOINTMENT=${JSON.stringify(snapshot)}`,
                                            },
                                        ],
                                    },
                                })
                            );

                            const summary = describeAppointment(lookup);
                            const reference = lookup?.id ? ` The reference number is ${lookup.id}.` : '';
                            ws.send(
                                JSON.stringify({
                                    type: 'response.create',
                                    response: {
                                        instructions: `${summary}${reference} Let me know if you'd like to change or cancel it.`,
                                    },
                                })
                            );
                            return;
                        }

                        if (fnName === 'get_appointment') {
                            const appointmentIdRaw = args.appointment_id ?? args.id ?? null;
                            let appointmentId = appointmentIdRaw != null ? Number(appointmentIdRaw) : Number.NaN;
                            if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
                                const cached = callState.getLastAppointment(callId)?.id ?? null;
                                appointmentId = cached != null ? Number(cached) : Number.NaN;
                            }

                            if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions:
                                                'I need the appointment reference number to open it. Could you share it with me?',
                                        },
                                    })
                                );
                                return;
                            }

                            const appointment = await crm.appointments.getById({ appointmentId }, ctx);

                            if (appointment?.error) {
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions:
                                                "I'm having trouble opening that booking. Let's double-check the reference or try again shortly.",
                                        },
                                    })
                                );
                                return;
                            }

                            if (!appointment) {
                                callState.clearLastAppointment(callId);
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions:
                                                "I don't have a booking with that reference on file. Could there be a typo in the number?",
                                        },
                                    })
                                );
                                return;
                            }

                            callState.setLastAppointment(callId, appointment);

                            const snapshot = appointmentSnapshot(appointment);
                            ws.send(
                                JSON.stringify({
                                    type: 'conversation.item.create',
                                    item: {
                                        type: 'message',
                                        role: 'system',
                                        content: [
                                            {
                                                type: 'input_text',
                                                text: `APPOINTMENT_DETAILS=${JSON.stringify(snapshot)}`,
                                            },
                                        ],
                                    },
                                })
                            );

                            const summary = describeAppointment(appointment);
                            ws.send(
                                JSON.stringify({
                                    type: 'response.create',
                                    response: {
                                        instructions: `${summary} Let me know what changes you'd like to make.`,
                                    },
                                })
                            );
                            return;
                        }

                        if (fnName === 'create_appointment') {
                            const slotArg = args.viewing_slot_id ?? args.slot_id ?? null;
                            const slotAsNumber = slotArg !== null && slotArg !== undefined ? Number(slotArg) : Number.NaN;
                            let slotId = Number.isFinite(slotAsNumber) && slotAsNumber > 0 ? slotAsNumber : null;

                            if (!slotId) {
                                const cached = callState.getLastSlotId(callId);
                                if (cached) slotId = cached;
                            }

                            const name = String(args.name || '').trim() || null;
                            const phone = normalizePhone(args.phone) || normalizePhone(fromCaller);
                            const email = args.email ? String(args.email).trim() : null;

                            if (!slotId || !name || !phone) {
                                log('warn', 'appt:create:missing-fields', {
                                    ctx,
                                    callId,
                                    slotId,
                                    hasName: !!name,
                                    hasPhone: !!phone,
                                });
                                return;
                            }

                            const appt = await crm.appointments.create({ slotId, name, phone, email }, ctx);
                            if (appt?.id) {
                                callState.clearLastSlotId(callId);
                                callState.setLastAppointment(callId, appt);
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions: `All set, your viewing is scheduled for ${appt.scheduled_at}. Your reference number is ${appt.id}.`,
                                        },
                                    })
                                );
                                return;
                            }

                            if (appt?.error?.status === 422) {
                                const next = await crm.appointments.getNextSlot({ listingId: listing?.id }, ctx);
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
                            const slotArg = args.viewing_slot_id ?? args.slot_id;
                            const slotCandidate = slotArg !== undefined && slotArg !== null ? Number(slotArg) : Number.NaN;
                            let slotId = Number.isFinite(slotCandidate) && slotCandidate > 0 ? slotCandidate : undefined;

                            if (slotId === undefined) {
                                const cachedSlot = callState.getLastSlotId(callId);
                                if (cachedSlot) slotId = cachedSlot;
                            }

                            const name = args.name != null ? String(args.name).trim() : undefined;
                            const phone = args.phone != null ? normalizePhone(args.phone) : undefined;
                            const email = args.email != null ? String(args.email).trim() : undefined;

                            let resolvedAppointmentId = args.appointment_id != null ? Number(args.appointment_id) : Number.NaN;
                            if (!Number.isFinite(resolvedAppointmentId) || resolvedAppointmentId <= 0) {
                                const cachedId = callState.getLastAppointment(callId)?.id ?? null;
                                resolvedAppointmentId = cachedId != null ? Number(cachedId) : Number.NaN;
                            }

                            if (!Number.isFinite(resolvedAppointmentId) || resolvedAppointmentId <= 0) {
                                log('warn', 'appt:update:missing-id', { ctx, callId });
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions:
                                                "I don't have the booking reference yet. Could you share the appointment number so I can update it?",
                                        },
                                    })
                                );
                                return;
                            }

                            const appt = await crm.appointments.update(
                                { appointmentId: resolvedAppointmentId, slotId, name, phone, email },
                                ctx
                            );

                            if (appt?.error) {
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions:
                                                "I'm unable to update that booking right now. Let's confirm the new time and try again shortly.",
                                        },
                                    })
                                );
                                return;
                            }

                            if (appt?.id) {
                                callState.clearLastSlotId(callId);
                                callState.setLastAppointment(callId, appt);
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
                            let appointmentId = args.appointment_id != null ? Number(args.appointment_id) : Number.NaN;
                            if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
                                const cachedId = callState.getLastAppointment(callId)?.id ?? null;
                                appointmentId = cachedId != null ? Number(cachedId) : Number.NaN;
                            }

                            if (!Number.isFinite(appointmentId) || appointmentId <= 0) {
                                log('warn', 'appt:cancel:missing-id', { ctx, callId });
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions:
                                                'I need the appointment reference number to cancel it. Could you share that with me?',
                                        },
                                    })
                                );
                                return;
                            }

                            const cancelResult = await crm.appointments.cancel({ appointmentId }, ctx);
                            if (cancelResult === true) {
                                callState.clearLastSlotId(callId);
                                callState.clearLastAppointment(callId);
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: { instructions: `Your appointment ${appointmentId} has been canceled.` },
                                    })
                                );
                                return;
                            }

                            if (cancelResult?.error) {
                                ws.send(
                                    JSON.stringify({
                                        type: 'response.create',
                                        response: {
                                            instructions:
                                                "I'm unable to cancel that booking right now. Let's confirm the reference and try again shortly.",
                                        },
                                    })
                                );
                                return;
                            }
                            return;
                        }
                    }
                });

                ws.on('error', (err) => log('warn', 'ws:error', { ctx, callId, attempt, err: err?.message }));

                ws.on('close', (code, reason) => {
                    const isFinalClose = opened || attempt >= maxAttempts;

                    log('info', 'ws:close', {
                        ctx,
                        callId,
                        attempt,
                        code,
                        reason: reason?.toString() || '',
                        opened,
                        isFinalClose,
                    });

                    if (isFinalClose) {
                        const startedAt = callState.getStartedAt(callId);
                        const durationSeconds = startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : null;
                        callState.clear(callId);
                        seenCalls.delete(callId);
                        const finalStatus = opened ? 'completed' : code === 1000 ? 'completed' : 'failed';
                        crm.calls
                            .end({ callSid: callId, status: finalStatus, durationSeconds, ctx })
                            .catch(() => {});
                    }

                    if (!opened && attempt < maxAttempts) {
                        setTimeout(tryConnect, delay);
                        delay = Math.min(delay * 2, 2000);
                    }
                });
            };

            setTimeout(tryConnect, initialDelayMs);
        });
    };
}

export function createOrchestrator({ config, log, crm }) {
    const openai = new OpenAI({
        apiKey: config.openaiApiKey,
        webhookSecret: config.openaiWebhookSecret,
    });

    const callState = createCallStateStore();
    const seenCalls = new Set();
    const connectRealtimeSession = createRealtimeSessionConnector({ config, log, crm, callState, seenCalls });

    const healthCheck = (_req, res) =>
        res.json({
            ok: true,
            service: 'ai-orchestrator',
            time: new Date().toISOString(),
        });

    const handleWebhook = async (req, res) => {
        const ctx = crypto.randomUUID();
        const t0 = process.hrtime.bigint();
        const sig = req.headers['webhook-signature'];

        log('info', 'webhook:received', {
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
            log('debug', 'webhook:unwrapped', {
                ctx,
                event_type: event?.type,
                unwrap_ms: unwrapMs.toFixed(1),
            });

            if (event?.type === 'realtime.call.incoming') {
                const callId = event?.data?.call_id;
                const fromHeader = headerVal(event?.data?.sip_headers, 'From');
                const toHeader = headerVal(event?.data?.sip_headers, 'To');
                const fromE164 = extractE164(fromHeader);

                const diagnostics = {
                    to: toHeader,
                    x_twilio_to: headerVal(event?.data?.sip_headers, 'X-Twilio-To'),
                    x_twilio_called_number: headerVal(event?.data?.sip_headers, 'X-Twilio-Called-Number'),
                    x_original_to: headerVal(event?.data?.sip_headers, 'X-Original-To'),
                    x_called_number: headerVal(event?.data?.sip_headers, 'X-Called-Number'),
                    p_called_party_id: headerVal(event?.data?.sip_headers, 'P-Called-Party-ID'),
                    p_asserted_identity: headerVal(event?.data?.sip_headers, 'P-Asserted-Identity'),
                    diversion: headerVal(event?.data?.sip_headers, 'Diversion'),
                };
                log('debug', 'sip:headers:summary', { ctx, ...diagnostics });

                const dialedE164 = extractDialedE164FromHeaders(event?.data?.sip_headers, fromE164);
                log('info', 'dialed:detected', { ctx, dialed_e164: dialedE164 });

                log('info', 'call:incoming', {
                    ctx,
                    callId,
                    fromHeader,
                    toHeader,
                    from_e164: fromE164,
                    dialed_e164: dialedE164,
                });

                if (seenCalls.has(callId)) {
                    log('debug', 'call:duplicate-webhook', { ctx, callId });
                    res.set('Authorization', `Bearer ${config.openaiApiKey}`);
                    res.sendStatus(200);
                    return;
                }
                seenCalls.add(callId);

                const listing = await crm.listings.fetchActiveByNumber(dialedE164, ctx);
                const propertyFacts = buildPropertyFacts(listing);
                const greeting = buildGreetingFromListing(listing);

                const instructions = buildAssistantInstructions({
                    greeting,
                    propertyFacts,
                });

                const acceptT0 = process.hrtime.bigint();
                const response = await fetch(`https://api.openai.com/v1/realtime/calls/${encodeURIComponent(callId)}/accept`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${config.openaiApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'realtime',
                        model: config.realtimeModel,
                        instructions,
                        tools: assistantTools,
                        audio: { output: { voice: config.realtimeVoice } },
                    }),
                });
                const acceptMs = Number(process.hrtime.bigint() - acceptT0) / 1e6;

                if (!response.ok) {
                    const body = await response.text().catch(() => '');
                    log('error', 'accept:failed', {
                        ctx,
                        callId,
                        status: response.status,
                        accept_ms: acceptMs.toFixed(1),
                        body: body?.slice(0, 2000),
                    });
                    res.status(500).send('Accept failed');
                    return;
                }

                log('info', 'accept:ok', {
                    ctx,
                    callId,
                    status: response.status,
                    accept_ms: acceptMs.toFixed(1),
                });

                callState.setStartedAt(callId, Date.now());

                crm.calls
                    .start({ callSid: callId, from: fromE164, to: dialedE164, ctx })
                    .then((callLogId) => {
                        if (callLogId) callState.setCallLogId(callId, callLogId);
                    })
                    .catch(() => {});

                res.set('Authorization', `Bearer ${config.openaiApiKey}`);
                res.sendStatus(200);

                try {
                    await connectRealtimeSession({
                        callId,
                        ctx,
                        listing,
                        greeting,
                        fromCaller: fromE164,
                        initialDelayMs: 800,
                        maxAttempts: 8,
                    });
                } catch (error) {
                    log('warn', 'ws:attach-failed', {
                        ctx,
                        callId,
                        err: String(error?.message || error),
                    });
                }

                const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
                log('debug', 'webhook:done', { ctx, total_ms: totalMs.toFixed(1) });
                return;
            }

            if (event?.type === 'realtime.call.ended') {
                const callId = event?.data?.call_id;
                const startedAt = callState.getStartedAt(callId);
                const durationSeconds = startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : null;
                callState.clear(callId);
                seenCalls.delete(callId);

                log('info', 'call:ended (webhook)', { ctx, callId, durationSeconds, cause: event?.data?.cause });
                await crm.calls.end({
                    callSid: callId,
                    status: 'completed',
                    durationSeconds,
                    meta: { source: 'openai-sip-webhook', cause: event?.data?.cause },
                    ctx,
                });
                res.sendStatus(200);
                return;
            }

            res.sendStatus(200);
            const totalMs = Number(process.hrtime.bigint() - t0) / 1e6;
            log('debug', 'webhook:ignored-event', {
                ctx,
                event_type: event?.type,
                total_ms: totalMs.toFixed(1),
            });
        } catch (error) {
            const message = String(error?.message ?? error);
            const isSigErr = error?.name === 'InvalidWebhookSignatureError' || message.toLowerCase().includes('invalid signature');
            log(isSigErr ? 'warn' : 'error', 'webhook:error', {
                ctx,
                err: message,
                name: error?.name,
                stack: error?.stack?.split('\n').slice(0, 3).join(' | '),
            });
            res.status(isSigErr ? 400 : 500).send(isSigErr ? 'Invalid signature' : 'Server error');
        }
    };

    return {
        healthCheck,
        handleWebhook,
    };
}
