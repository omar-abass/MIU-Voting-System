import { forwardRef, useId, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/** Shared wrapper: label, hint and error message wired to the control with aria attributes. */
function FieldShell({ id, label, hint, error, optional, className = '', children }) {
  const { t } = useTranslation();
  return (
    <div className={`field ${className}`}>
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
          {optional && <span className="optional"> ({t('common.optional')})</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <div className="field__hint" id={`${id}-hint`}>
          {hint}
        </div>
      )}
      {error && (
        <div className="field__error" id={`${id}-error`} role="alert">
          <AlertCircle size={14} aria-hidden="true" /> {error}
        </div>
      )}
    </div>
  );
}

const describedBy = (id, hint, error) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

export const TextField = forwardRef(function TextField(
  { label, hint, error, optional, icon: Icon, className, inputClassName = '', id: idProp, ...rest },
  ref
) {
  const auto = useId();
  const id = idProp ?? auto;
  const control = (
    <input
      ref={ref}
      id={id}
      className={`input ${inputClassName}`}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedBy(id, hint, error)}
      {...rest}
    />
  );
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      {Icon ? (
        <div className="input-icon">
          <Icon aria-hidden="true" />
          {control}
        </div>
      ) : (
        control
      )}
    </FieldShell>
  );
});

export const PasswordField = forwardRef(function PasswordField({ label, hint, error, className, id: idProp, showStrength = false, value, ...rest }, ref) {
  const { t } = useTranslation();
  const auto = useId();
  const id = idProp ?? auto;
  const [visible, setVisible] = useState(false);
  const level = showStrength ? passwordStrength(value) : 0;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <div className="input-wrap">
        <input
          ref={ref}
          id={id}
          className="input"
          type={visible ? 'text' : 'password'}
          value={value}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy(id, hint, error)}
          dir="ltr"
          style={{ textAlign: 'start' }}
          {...rest}
        />
        <button
          type="button"
          className="input-wrap__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
          aria-pressed={visible}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
      {showStrength && value && (
        <div className="strength" data-level={level} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      )}
    </FieldShell>
  );
});

/** 0-4: length, lower+upper, digit, symbol/long. Display only; the server enforces the real policy. */
export function passwordStrength(value = '') {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value) || value.length >= 12) score += 1;
  return Math.max(score, 1);
}

export const SelectField = forwardRef(function SelectField({ label, hint, error, optional, className, id: idProp, children, ...rest }, ref) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <select ref={ref} id={id} className="select" aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy(id, hint, error)} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
});

export const TextareaField = forwardRef(function TextareaField({ label, hint, error, optional, className, id: idProp, ...rest }, ref) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} optional={optional} className={className}>
      <textarea ref={ref} id={id} className="textarea" aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy(id, hint, error)} {...rest} />
    </FieldShell>
  );
});

export function CheckField({ label, children, ...rest }) {
  return (
    <label className="check">
      <input type="checkbox" {...rest} />
      <span>{label ?? children}</span>
    </label>
  );
}

export function SwitchField({ label, description, checked, onChange, disabled, id: idProp, ...rest }) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <label className="switch" htmlFor={id}>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange?.(e.target.checked)} disabled={disabled} {...rest} />
      <span className="switch__track" aria-hidden="true" />
      <span>
        <span className="bold">{label}</span>
        {description && <span className="muted sm" style={{ display: 'block' }}>{description}</span>}
      </span>
    </label>
  );
}
