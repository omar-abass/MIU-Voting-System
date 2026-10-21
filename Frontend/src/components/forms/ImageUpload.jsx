import { useId, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { assetUrl } from '../../utils/env.js';
import { errorText } from '../../utils/errors.js';
import { Button } from '../common/Button.jsx';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_UPLOAD_MB = Number(import.meta.env.VITE_MAX_UPLOAD_MB || 2);

/**
 * Uploads through `upload(file) -> { path } | user object` and reports the stored path via onChange.
 * Client-side checks are only a convenience; the server re-validates the real file signature and size.
 */
export function ImageUpload({ value, onChange, upload, label, round = false, disabled = false, fallback, removable = true, extractPath = (r) => r?.path }) {
  const { t } = useTranslation();
  const id = useId();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const src = assetUrl(value);

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    if (!ALLOWED.includes(file.type)) return setError(t('errors.invalid_image'));
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return setError(t('errors.file_too_large', { mb: MAX_UPLOAD_MB }));
    setBusy(true);
    try {
      const result = await upload(file);
      onChange(extractPath(result), result);
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="upload">
        <div className={`upload__preview${round ? ' upload__preview--round' : ''}`}>
          {src ? <img src={src} alt="" /> : (fallback ?? <ImagePlus size={24} aria-hidden="true" />)}
        </div>
        <div className="row">
          <input ref={inputRef} id={id} type="file" accept={ALLOWED.join(',')} onChange={onFile} className="sr-only" disabled={disabled || busy} />
          <Button size="sm" loading={busy} disabled={disabled} onClick={() => inputRef.current?.click()}>
            <ImagePlus aria-hidden="true" /> {src ? t('upload.change') : t('upload.choose')}
          </Button>
          {src && !busy && removable && (
            <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onChange(null, null)}>
              <Trash2 aria-hidden="true" /> {t('upload.remove')}
            </Button>
          )}
        </div>
      </div>
      <div className="field__hint">{t('upload.hint', { mb: MAX_UPLOAD_MB })}</div>
      {error && (
        <div className="field__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
