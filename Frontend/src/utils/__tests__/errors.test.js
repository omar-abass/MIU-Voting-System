// PLACEHOLDER: Original contents were not present in this checkout.
import { describe, expect, it } from 'vitest';
import i18n from '../../i18n/index.js';
import { ApiError } from '../../services/api.js';
import { errorDetails, errorText, fieldErrors } from '../errors.js';

const t = i18n.getFixedT('en');

describe('errorText', () => {
  it('translates known backend codes and never shows the raw server message', () => {
    const err = new ApiError(401, 'invalid_credentials', 'raw english message from the server');
    expect(errorText(t, err)).toBe(i18n.getResource('en', 'translation', 'errors.invalid_credentials') ?? t('errors.invalid_credentials'));
    expect(errorText(t, err)).not.toContain('raw english message');
  });

  it('falls back to a network message for status 0 and a generic one for unknown codes', () => {
    expect(errorText(t, new ApiError(0, 'network_error'))).toBe(t('errors.network_error'));
    expect(errorText(t, new ApiError(500, 'some_unmapped_code'))).toBe(t('errors.internal_error'));
    expect(errorText(t, new Error('boom'))).toBe(t('errors.internal_error'));
  });

  it('is silent for aborted requests', () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    expect(errorText(t, abort)).toBe('');
  });
});

describe('fieldErrors', () => {
  it('maps validation details to translated messages per field (first message wins)', () => {
    const err = new ApiError(400, 'validation_error', 'x', [
      { field: 'email', message: 'validation.email' },
      { field: 'email', message: 'validation.required' },
      { field: 'options.0.title', message: 'unknown text' }
    ]);
    const out = fieldErrors(t, err);
    expect(out.email).toBe(t('validation.email'));
    expect(out['options.0.title']).toBe(t('validation.invalid'));
  });

  it('returns nothing for other errors', () => {
    expect(fieldErrors(t, new ApiError(500, 'internal_error'))).toEqual({});
    expect(fieldErrors(t, new Error('x'))).toEqual({});
  });

  it('exposes object details only', () => {
    expect(errorDetails(new ApiError(403, 'club_subscription_required', 'x', { clubName: 'Robotics' }))).toEqual({ clubName: 'Robotics' });
    expect(errorDetails(new ApiError(400, 'validation_error', 'x', [{ field: 'a' }]))).toBeNull();
    expect(errorDetails(new Error('x'))).toBeNull();
  });
});
