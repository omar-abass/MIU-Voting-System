import { useEffect, useState } from 'react';
import { ShieldCheck, RotateCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCountdown } from '../../hooks/useCountdown.js';
import { errorText } from '../../utils/errors.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { Button } from '../common/Button.jsx';
import { Alert } from '../common/Feedback.jsx';
import { OtpInput, OTP_LENGTH } from './OtpInput.jsx';

const pad = (n) => String(n).padStart(2, '0');

/**
 * Phone verification step used by registration, password reset/change and voting.
 * `challenge` comes from the API: { challengeId, maskedPhone, expiresAt, resendAvailableAt }.
 * `onSubmit(code)` verifies; `onResend()` must return the NEW challenge (the parent stores it).
 * The code itself is never stored anywhere except this component's state while typing.
 */
export function OtpVerifyPanel({ challenge, onSubmit, onResend, submitLabel, intro, autoFocusCode = true, children }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const expiry = useCountdown(challenge.expiresAt);
  const cooldown = useCountdown(challenge.resendAvailableAt);

  useEffect(() => {
    setCode('');
    setError('');
  }, [challenge.challengeId]);

  const submit = async (value = code) => {
    if (value.length !== OTP_LENGTH || busy) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit(value);
    } catch (err) {
      setError(errorText(t, err));
      if (err?.code === 'otp_invalid') setCode('');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError('');
    try {
      await onResend();
      toast.success(t('otp.resent'));
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setResending(false);
    }
  };

  const secondsLeft = expiry.total;
  return (
    <form
      className="otp-step"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <div className="state__icon" style={{ margin: '0 auto', width: 56, height: 56 }}>
        <ShieldCheck aria-hidden="true" size={26} />
      </div>
      <div>
        <p>{intro ?? t('otp.sentTo')}</p>
        <p className="otp-step__phone">{challenge.maskedPhone}</p>
      </div>
      {children}
      <OtpInput value={code} onChange={setCode} onComplete={submit} disabled={busy} error={Boolean(error)} autoFocus={autoFocusCode} />
      <p className="muted sm" aria-live="off">
        {expiry.expired ? t('otp.expired') : t('otp.expiresIn', { time: `${pad(Math.floor(secondsLeft / 60))}:${pad(secondsLeft % 60)}` })}
      </p>
      {error && (
        <Alert variant="danger" role="alert">
          {error}
        </Alert>
      )}
      <Button type="submit" variant="primary" size="lg" block loading={busy} disabled={code.length !== OTP_LENGTH}>
        {submitLabel ?? t('otp.verify')}
      </Button>
      <Button variant="ghost" onClick={resend} loading={resending} disabled={!cooldown.expired || busy}>
        <RotateCw aria-hidden="true" />
        {cooldown.expired ? t('otp.resend') : t('otp.resendIn', { seconds: cooldown.total })}
      </Button>
    </form>
  );
}
