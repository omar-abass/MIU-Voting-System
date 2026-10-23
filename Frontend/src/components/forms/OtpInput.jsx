import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export const OTP_LENGTH = Number(import.meta.env.VITE_OTP_LENGTH || 6);

/**
 * One box per digit. Supports typing, backspace navigation, arrow keys and pasting a full code
 * (also works with the browser's SMS autofill via autocomplete="one-time-code").
 */
export function OtpInput({ value, onChange, length = OTP_LENGTH, disabled = false, autoFocus = true, error = false, onComplete }) {
  const { t } = useTranslation();
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const commit = (next) => {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const onInput = (index, event) => {
    const typed = event.target.value.replace(/\D/g, '');
    if (!typed) return;
    if (typed.length > 1) {
      commit(value.slice(0, index) + typed);
      refs.current[Math.min(index + typed.length, length - 1)]?.focus();
      return;
    }
    const next = digits.slice();
    next[index] = typed;
    commit(next.join(''));
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const onKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const next = digits.slice();
      if (next[index]) {
        next[index] = '';
        commit(next.join(''));
      } else if (index > 0) {
        next[index - 1] = '';
        commit(next.join(''));
        refs.current[index - 1]?.focus();
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      refs.current[Math.max(index - 1, 0)]?.focus();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      refs.current[Math.min(index + 1, length - 1)]?.focus();
    }
  };

  const onPaste = (event) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    commit(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="otp" role="group" aria-label={t('otp.groupLabel')} onPaste={onPaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(node) => {
            refs.current[i] = node;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit}
          disabled={disabled}
          aria-label={t('otp.digit', { n: i + 1, total: length })}
          aria-invalid={error || undefined}
          onChange={(e) => onInput(i, e)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
