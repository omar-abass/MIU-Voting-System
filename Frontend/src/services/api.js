import { API_URL } from '../utils/env.js';

/** Error thrown for every failed API call. `code` is a stable identifier translated by the UI. */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message || code);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let csrfToken = null;
let unauthorizedHandler = null;

export const setCsrfToken = (token) => {
  csrfToken = token;
};
export const onUnauthorized = (handler) => {
  unauthorizedHandler = handler;
};

// A 401 on these paths is an ordinary answer (wrong password, no session yet), not an expired session.
const NO_REDIRECT_PATHS = ['/auth/login', '/auth/register', '/auth/verify-phone', '/auth/forgot-password', '/auth/reset-password', '/auth/me'];

async function request(method, path, { body, formData, query, signal } = {}) {
  const url = new URL(`${API_URL}${path}`, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const headers = { Accept: 'application/json' };
  if (csrfToken && method !== 'GET') headers['X-CSRF-Token'] = csrfToken;
  let payload;
  if (formData) payload = formData;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, { method, headers, body: payload, credentials: 'include', signal });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError(0, 'network_error', 'Network error');
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok || json?.success === false) {
    const e = json?.error ?? {};
    const err = new ApiError(response.status, e.code || 'internal_error', e.message, e.details);
    if (response.status === 401 && !NO_REDIRECT_PATHS.some((p) => path.startsWith(p)) && unauthorizedHandler) unauthorizedHandler(err);
    throw err;
  }
  return { data: json?.data ?? null, meta: json?.meta ?? null };
}

export const api = {
  get: (path, query, signal) => request('GET', path, { query, signal }),
  post: (path, body) => request('POST', path, { body: body ?? {} }),
  put: (path, body) => request('PUT', path, { body: body ?? {} }),
  patch: (path, body) => request('PATCH', path, { body }),
  delete: (path) => request('DELETE', path),
  upload: (path, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('POST', path, { formData });
  }
};
