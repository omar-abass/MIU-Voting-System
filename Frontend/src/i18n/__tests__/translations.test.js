import { describe, expect, it } from 'vitest';
import { check } from '../../../scripts/i18n-scan.mjs';

describe('translations', () => {
  const result = check();

  it('every key used in the source exists in English', () => {
    expect(result.problems.filter((p) => p.startsWith('missing in en'))).toEqual([]);
  });

  it('English and Arabic have exactly the same keys', () => {
    expect(result.problems.filter((p) => p.startsWith('missing in ar') || p.startsWith('extra in ar'))).toEqual([]);
    expect(result.enCount).toBe(result.arCount);
  });

  it('placeholders match and no value is empty', () => {
    expect(result.problems.filter((p) => p.startsWith('placeholder mismatch') || p.startsWith('empty value'))).toEqual([]);
  });

  it('has no other scan problems', () => {
    expect(result.problems).toEqual([]);
  });
});
