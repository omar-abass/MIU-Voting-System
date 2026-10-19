import { STUDENT_ID_PATTERN } from './env.js';

/**
 * Client-side validators. They mirror the backend rules only to give instant feedback;
 * the server repeats every check and is the source of truth.
 * Each returns an i18n key (validation.*) or null when the value is acceptable.
 */

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹';

export function westernDigits(input = '') {
  return String(input).replace(/[٠-٩۰-۹]/g, (d) => {
    const a = ARABIC_INDIC.indexOf(d);
    return a >= 0 ? String(a) : String(EASTERN_ARABIC.indexOf(d));
  });
}

export const required = (v) => (v === undefined || v === null || String(v).trim() === '' ? 'validation.required' : null);

export function username(v) {
  const s = (v ?? '').trim();
  if (!s) return 'validation.required';
  if (s.length < 3 || s.length > 30) return 'validation.usernameLength';
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(s)) return 'validation.usernameChars';
  return null;
}

export function password(v) {
  if (!v) return 'validation.required';
  if (v.length < 8 || !/[a-z]/.test(v) || !/[A-Z]/.test(v) || !/\d/.test(v)) return 'validation.passwordWeak';
  if (new TextEncoder().encode(v).length > 72) return 'validation.passwordTooLong';
  return null;
}

export const passwordMatch = (a, b) => (a === b ? null : 'validation.passwordMismatch');

export function email(v) {
  const s = (v ?? '').trim();
  if (!s) return 'validation.required';
  if (s.length > 190 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return 'validation.email';
  return null;
}

/** Egyptian mobile numbers: 010/011/012/015 + 8 digits, in the usual written forms. */
export function phone(v) {
  const s = westernDigits(v ?? '').trim().replace(/[\s\-().]/g, '');
  if (!s) return 'validation.required';
  return /^(?:\+20|0020|20|0)(1[0125]\d{8})$/.test(s) ? null : 'validation.phone';
}

export function studentId(v) {
  const s = westernDigits(v ?? '').trim();
  if (!s) return 'validation.required';
  try {
    return new RegExp(STUDENT_ID_PATTERN).test(s) ? null : 'validation.studentId';
  } catch {
    return null;
  }
}

export const faculty = (v) => (v ? null : 'validation.faculty');

/** Runs { field: validatorResult } and returns only the failing entries. */
export function collect(checks) {
  const errors = {};
  for (const [field, result] of Object.entries(checks)) {
    if (result) errors[field] = result;
  }
  return errors;
}
