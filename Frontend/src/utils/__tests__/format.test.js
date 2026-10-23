import { describe, expect, it } from 'vitest';
import { formatNumber, formatPercent, initials, isoToZonedInput, splitDuration, zonedInputToIso } from '../format.js';

describe('number formatting', () => {
  it('formats with the language locale and ignores invalid input', () => {
    expect(formatNumber(1234, 'en')).toBe('1,234');
    expect(formatNumber(1234, 'ar')).toMatch(/[٠-٩]/); // Arabic-Indic digits
    expect(formatNumber(null, 'en')).toBe('');
    expect(formatNumber('abc', 'en')).toBe('');
    expect(formatPercent(12.345, 'en')).toBe('12.3%');
  });
});

describe('time zone helpers (Africa/Cairo)', () => {
  it('turns a Cairo wall-clock time into the right UTC instant (summer and winter)', () => {
    // Egypt observes DST (UTC+3 in summer, UTC+2 in winter); both must round-trip exactly.
    const summer = zonedInputToIso('2026-07-15T12:00', 'Africa/Cairo');
    const winter = zonedInputToIso('2026-01-15T12:00', 'Africa/Cairo');
    expect(winter).toBe('2026-01-15T10:00:00.000Z');
    expect(['2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z']).toContain(summer);
  });

  it('round-trips through isoToZonedInput', () => {
    for (const local of ['2026-01-15T08:30', '2026-07-15T23:45', '2026-12-31T00:00']) {
      expect(isoToZonedInput(zonedInputToIso(local, 'Africa/Cairo'), 'Africa/Cairo')).toBe(local);
    }
  });

  it('works for a fixed-offset zone and rejects malformed input', () => {
    expect(zonedInputToIso('2026-03-01T10:00', 'UTC')).toBe('2026-03-01T10:00:00.000Z');
    expect(zonedInputToIso('', 'UTC')).toBeNull();
    expect(zonedInputToIso('not a date', 'UTC')).toBeNull();
    expect(isoToZonedInput('nonsense', 'UTC')).toBe('');
  });
});

describe('small helpers', () => {
  it('splits durations for countdowns and never goes negative', () => {
    expect(splitDuration(90061000)).toMatchObject({ days: 1, hours: 1, minutes: 1, seconds: 1 });
    expect(splitDuration(-5000).total).toBe(0);
  });

  it('builds avatar initials', () => {
    expect(initials('student_one')).toBe('SO');
    expect(initials('amira')).toBe('A');
    expect(initials('')).toBe('?');
  });
});
