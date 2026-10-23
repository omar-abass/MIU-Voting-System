import { APP_TIMEZONE } from './env.js';

const localeFor = (lang) => (lang === 'ar' ? 'ar-EG' : 'en-GB');

function toDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateTime(value, lang = 'en', opts = {}) {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(localeFor(lang), {
    timeZone: APP_TIMEZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...opts
  }).format(d);
}

export function formatDate(value, lang = 'en') {
  const d = toDate(value);
  if (!d) return '';
  return new Intl.DateTimeFormat(localeFor(lang), { timeZone: APP_TIMEZONE, day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

export function formatDateRange(start, end, lang = 'en') {
  const s = toDate(start);
  const e = toDate(end);
  if (!s || !e) return '';
  const fmt = new Intl.DateTimeFormat(localeFor(lang), { timeZone: APP_TIMEZONE, day: 'numeric', month: 'short' });
  const year = new Intl.DateTimeFormat(localeFor(lang), { timeZone: APP_TIMEZONE, year: 'numeric' }).format(e);
  return `${fmt.format(s)} - ${fmt.format(e)}, ${year}`;
}

export function formatNumber(n, lang = 'en', opts = {}) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '';
  return new Intl.NumberFormat(localeFor(lang), opts).format(Number(n));
}

export const formatPercent = (n, lang = 'en') => `${formatNumber(n, lang, { maximumFractionDigits: 1 })}%`;

/** Splits a millisecond duration for countdowns. */
export function splitDuration(ms) {
  const total = Math.max(Math.floor(ms / 1000), 0);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total
  };
}

// ---- Entering dates in the application time zone (forms use <input type="datetime-local">) ----

function zoneOffsetMs(timestamp, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(new Date(timestamp));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return asUtc - Math.floor(timestamp / 1000) * 1000;
}

/** "2026-10-12T14:30" typed as a clock time in the app time zone -> ISO string in UTC. */
export function zonedInputToIso(value, timeZone = APP_TIMEZONE) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  const first = naive - zoneOffsetMs(naive, timeZone);
  const result = naive - zoneOffsetMs(first, timeZone); // second pass settles DST transitions
  return new Date(result).toISOString();
}

/** ISO instant -> "YYYY-MM-DDTHH:mm" as it reads on a wall clock in the app time zone. */
export function isoToZonedInput(iso, timeZone = APP_TIMEZONE) {
  const d = toDate(iso);
  if (!d) return '';
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).formatToParts(d);
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}`;
}

export const initials = (name = '') =>
  name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('') || '?';
