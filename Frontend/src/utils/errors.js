import { ApiError } from '../services/api.js';

/**
 * Turns any thrown value into text for the current language.
 * Backend error codes map to `errors.<code>`; unknown codes fall back to a generic message
 * (the English server message is never shown to users).
 */
export function errorText(t, err) {
  if (err instanceof ApiError) {
    const key = `errors.${err.code}`;
    const translated = t(key, { defaultValue: '' });
    if (translated) return translated;
    return err.status === 0 ? t('errors.network_error') : t('errors.internal_error');
  }
  if (err?.name === 'AbortError') return '';
  return t('errors.internal_error');
}

/**
 * Maps a `validation_error` response to `{ field: translatedMessage }` so forms can
 * show each message next to the field it belongs to. Fields like `options.0.title` are kept as-is.
 */
export function fieldErrors(t, err) {
  const out = {};
  if (!(err instanceof ApiError) || err.code !== 'validation_error' || !Array.isArray(err.details)) return out;
  for (const issue of err.details) {
    const field = issue.field ?? '_';
    if (out[field]) continue;
    const message = typeof issue.message === 'string' && issue.message.startsWith('validation.') ? t(issue.message, { defaultValue: '' }) : '';
    out[field] = message || t('validation.invalid');
  }
  return out;
}

/** Details returned with some errors (e.g. club name for club_subscription_required). */
export const errorDetails = (err) => (err instanceof ApiError && err.details && !Array.isArray(err.details) ? err.details : null);
