import { describe, expect, it } from 'vitest';
import * as v from '../validation.js';

describe('validation helpers', () => {
  it('converts Arabic-Indic and Eastern Arabic digits to western digits', () => {
    expect(v.westernDigits('٠١٠١٢٣٤٥٦٧٨')).toBe('01012345678');
    expect(v.westernDigits('۰۱۱۲۳۴۵۶۷۸۹')).toBe('0112345678' + '9');
    expect(v.westernDigits('abc 12')).toBe('abc 12');
  });

  it('requires a username of 3-30 safe characters', () => {
    expect(v.username('')).toBe('validation.required');
    expect(v.username('ab')).toBe('validation.usernameLength');
    expect(v.username('a'.repeat(31))).toBe('validation.usernameLength');
    expect(v.username('bad name')).toBe('validation.usernameChars');
    expect(v.username('<script>')).toBe('validation.usernameChars');
    expect(v.username('.leading')).toBe('validation.usernameChars');
    expect(v.username('student_one')).toBeNull();
    expect(v.username('first.last-2')).toBeNull();
  });

  it('enforces the password policy (8+ chars, lower, upper, digit)', () => {
    expect(v.password('')).toBe('validation.required');
    expect(v.password('Short1a')).toBe('validation.passwordWeak');
    expect(v.password('alllowercase1')).toBe('validation.passwordWeak');
    expect(v.password('ALLUPPERCASE1')).toBe('validation.passwordWeak');
    expect(v.password('NoDigitsHere')).toBe('validation.passwordWeak');
    expect(v.password('Abcdef12')).toBeNull();
    expect(v.password(`Aa1${'x'.repeat(80)}`)).toBe('validation.passwordTooLong');
  });

  it('compares password confirmation exactly', () => {
    expect(v.passwordMatch('Abcdef12', 'Abcdef12')).toBeNull();
    expect(v.passwordMatch('Abcdef12', 'abcdef12')).toBe('validation.passwordMismatch');
  });

  it('validates e-mail addresses', () => {
    expect(v.email('')).toBe('validation.required');
    expect(v.email('not-an-email')).toBe('validation.email');
    expect(v.email('a@b')).toBe('validation.email');
    expect(v.email('name@example.com')).toBeNull();
  });

  it('accepts Egyptian mobile numbers in common forms and rejects the rest', () => {
    for (const ok of ['01012345678', '+201112345678', '0020 1212345678', '010-1234-5678', '٠١٠١٢٣٤٥٦٧٨', '201512345678']) {
      expect(v.phone(ok), ok).toBeNull();
    }
    for (const bad of ['0131234567', '0101234567', '+971501234567', '12345', 'phone']) {
      expect(v.phone(bad), bad).toBe('validation.phone');
    }
    expect(v.phone('')).toBe('validation.required');
  });

  it('validates the student ID against the configured pattern (default: 6-10 digits)', () => {
    expect(v.studentId('')).toBe('validation.required');
    expect(v.studentId('12ab56')).toBe('validation.studentId');
    expect(v.studentId('12345')).toBe('validation.studentId');
    expect(v.studentId('123456')).toBeNull();
    expect(v.studentId('١٢٣٤٥٦٧')).toBeNull();
  });

  it('requires a faculty and collects only failing fields', () => {
    expect(v.faculty('')).toBe('validation.faculty');
    expect(v.faculty('3')).toBeNull();
    expect(v.collect({ a: null, b: 'validation.required', c: undefined })).toEqual({ b: 'validation.required' });
  });
});
