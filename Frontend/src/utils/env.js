const env = import.meta.env;

export const API_URL = (env.VITE_API_URL || 'http://localhost:4000/api/v1').replace(/\/+$/, '');
export const APP_TIMEZONE = env.VITE_APP_TIMEZONE || 'Africa/Cairo';
export const ROUTER_MODE = env.VITE_ROUTER === 'hash' ? 'hash' : 'browser';
export const BASE_PATH = env.BASE_URL || '/';
export const STUDENT_ID_PATTERN = env.VITE_STUDENT_ID_PATTERN || '^[0-9]{6,10}$';

/** Origin of the API server (used to build image URLs for /uploads/...). */
export const API_ORIGIN = (() => {
  try {
    return new URL(API_URL, window.location.origin).origin;
  } catch {
    return '';
  }
})();

/** Turns a stored upload path (/uploads/...) into an absolute URL. Anything else is ignored. */
export function assetUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (path.startsWith('/uploads/')) return `${API_ORIGIN}${path}`;
  return null;
}
