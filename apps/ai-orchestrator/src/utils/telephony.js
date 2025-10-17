// src/utils/telephony.js
export const headerVal = (sipHeaders, name) =>
    sipHeaders?.find((h) => h?.name?.toLowerCase() === name.toLowerCase())?.value || '';

export const extractE164 = (input) => {
    const match = String(input || '').match(/\+?\d{6,15}/);
    return match ? match[0] : null;
};

export const extractE164FromSipUri = (sipUri) => {
    const match = String(sipUri || '').match(/sip:(\+?\d{6,15})@/i);
    return match ? match[1] : null;
};

export function extractDialedE164FromHeaders(sipHeaders = [], fromE164 = null) {
    const get = (name) => headerVal(sipHeaders, name);

    const diversion = get('Diversion');
    const diversionNumber = extractE164(diversion);
    if (diversionNumber && diversionNumber !== fromE164) return diversionNumber;

    const candidates = ['X-Twilio-To', 'X-Twilio-Called-Number', 'X-Original-To', 'X-Called-Number', 'P-Called-Party-ID'];
    for (const name of candidates) {
        const value = get(name);
        if (!value) continue;
        const e164 = extractE164(value);
        if (e164 && e164 !== fromE164) return e164;
    }

    const toHeader = get('To');
    const registeredUser = extractE164FromSipUri(toHeader);
    if (registeredUser && registeredUser !== fromE164) return registeredUser;

    return null;
}
