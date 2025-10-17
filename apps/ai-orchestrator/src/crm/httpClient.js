// src/crm/httpClient.js
import axios from 'axios';

export function sanitizeBaseUrl(baseUrl) {
    return String(baseUrl || '').replace(/\/$/, '');
}

export function createHttpClient({ baseUrl, token, timeout = 7000 }) {
    const sanitized = sanitizeBaseUrl(baseUrl);
    if (!sanitized) return null;

    return axios.create({
        baseURL: sanitized,
        timeout,
        headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}
