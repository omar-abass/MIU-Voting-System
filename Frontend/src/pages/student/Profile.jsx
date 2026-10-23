import { useEffect, useState } from 'react';
import { KeyRound, Pencil, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api.js';
import { authApi, referenceApi, userApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { errorText, fieldErrors } from '../../utils/errors.js';
import { formatDateTime } from '../../utils/format.js';
import { facultyName } from '../../utils/names.js';
import * as v from '../../utils/validation.js';
import { Button } from '../../components/common/Button.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Avatar, Badge, PageHead } from '../../components/common/Display.jsx';
import { Alert } from '../../components/common/Feedback.jsx';
import { PasswordField, SelectField, TextField } from '../../components/forms/Fields.jsx';
import { ImageUpload } from '../../components/forms/ImageUpload.jsx';
import { OtpVerifyPanel } from '../../components/forms/OtpVerifyPanel.jsx';
import { Modal } from '../../components/common/Modal.jsx';

function ProfileForm({ user, onSaved }) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const toast = useToast();
  const faculties = useApi(() => referenceApi.faculties(), []);
  const [form, setForm] = useState({ username: user.username, email: user.email, facultyId: String(user.faculty?.id ?? '') });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => setForm({ username: user.username, email: user.email, facultyId: String(user.faculty?.id ?? '') }), [user]);

  const dirty = form.username !== user.username || form.email !== user.email || form.facultyId !== String(user.faculty?.id ?? '');

  const submit = async (event) => {
    event.preventDefault();
    const found = v.collect({ username: v.username(form.username), email: v.email(form.email), facultyId: form.facultyId ? null : 'validation.faculty' });
    setErrors(Object.fromEntries(Object.entries(found).map(([k, key]) => [k, t(key)])));
    setFormError('');
    if (Object.keys(found).length) return;
    const body = {};
    if (form.username.trim() !== user.username) body.username = form.username.trim();
    if (form.email.trim().toLowerCase() !== user.email) body.email = form.email.trim();
    if (form.facultyId !== String(user.faculty?.id ?? '')) body.facultyId = Number(form.facultyId);
    if (!Object.keys(body).length) return;
    setBusy(true);
    try {
      onSaved(await userApi.update(body));
      toast.success(t('profile.saved'));
    } catch (err) {
      const mapped = fieldErrors(t, err);
      if (Object.keys(mapped).length) setErrors(mapped);
      setFormError(errorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      {formError && <Alert variant="danger">{formError}</Alert>}
      <div className="form-grid">
        <TextField label={t('auth.username')} value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} error={errors.username} autoComplete="username" />
        <TextField label={t('auth.email')} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} error={errors.email} autoComplete="email" dir="ltr" />
        {user.role !== 'admin' || user.faculty ? (
          <SelectField label={t('auth.faculty')} value={form.facultyId} onChange={(e) => setForm((f) => ({ ...f, facultyId: e.target.value }))} error={errors.facultyId} className="span-2">
            {!form.facultyId && <option value="">{t('auth.facultyPlaceholder')}</option>}
            {(faculties.data ?? []).map((f) => (
              <option key={f.id} value={f.id}>
                {facultyName(f, lang)}
              </option>
            ))}
          </SelectField>
        ) : null}
      </div>
      <div className="form-actions">
        <Button type="submit" variant="primary" loading={busy} disabled={!dirty}>
          <Save aria-hidden="true" /> {t('common.saveChanges')}
        </Button>
      </div>
    </form>
  );
}

function PasswordChange() {
  const { t } = useTranslation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState(null);

  const reset = () => {
    setOpen(false);
    setChallenge(null);
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setErrors({});
    setFormError('');
  };

  const request = async () => {
    const found = v.collect({
      currentPassword: v.required(form.currentPassword),
      newPassword: v.password(form.newPassword),
      confirmPassword: v.passwordMatch(form.newPassword, form.confirmPassword)
    });
    setErrors(Object.fromEntries(Object.entries(found).map(([k, key]) => [k, t(key)])));
    setFormError('');
    if (Object.keys(found).length) throw new ApiError(400, 'validation_error');
    return authApi.requestPasswordChange(form);
  };

  const onSubmitForm = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      setChallenge(await request());
    } catch (err) {
      if (!(err instanceof ApiError && err.code === 'validation_error' && Object.keys(errors).length === 0 && err.details === undefined)) {
        const mapped = fieldErrors(t, err);
        if (Object.keys(mapped).length) setErrors(mapped);
        setFormError(errorText(t, err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="muted" style={{ marginBottom: 14 }}>{t('profile.passwordText')}</p>
      <Button onClick={() => setOpen(true)}>
        <KeyRound aria-hidden="true" /> {t('profile.changePassword')}
      </Button>
      <Modal open={open} onClose={reset} title={t('profile.changePassword')} closeOnBackdrop={false}>
        {!challenge ? (
          <form className="form-stack" onSubmit={onSubmitForm} noValidate>
            {formError && <Alert variant="danger">{formError}</Alert>}
            <PasswordField label={t('profile.currentPassword')} value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} error={errors.currentPassword} autoComplete="current-password" data-autofocus />
            <PasswordField label={t('auth.newPassword')} value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} error={errors.newPassword} autoComplete="new-password" showStrength hint={t('auth.passwordHint')} />
            <PasswordField label={t('auth.confirmPassword')} value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} error={errors.confirmPassword} autoComplete="new-password" />
            <p className="muted sm">{t('profile.passwordCodeNote')}</p>
            <div className="modal__actions" style={{ marginTop: 4 }}>
              <Button onClick={reset}>{t('common.cancel')}</Button>
              <Button type="submit" variant="primary" loading={busy}>
                {t('auth.sendCode')}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <OtpVerifyPanel
              challenge={challenge}
              submitLabel={t('profile.confirmChange')}
              onSubmit={async (code) => {
                await authApi.confirmPasswordChange({ challengeId: challenge.challengeId, code });
                toast.success(t('profile.passwordChanged'));
                reset();
              }}
              onResend={async () => setChallenge(await authApi.resendOtp(challenge.challengeId))}
            />
            <div className="modal__actions" style={{ marginTop: 8 }}>
              <Button variant="ghost" onClick={reset}>
                {t('common.cancel')}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { user, setUser } = useAuth();
  useDocumentTitle(t('nav.profile'));

  const rows = [
    [t('auth.email'), user.email],
    [t('profile.phone'), user.phoneMasked ? <span className="ltr">{user.phoneMasked}</span> : '–'],
    [t('auth.studentId'), user.studentIdMasked ? <span className="ltr">{user.studentIdMasked}</span> : '–'],
    [t('auth.faculty'), user.faculty ? facultyName(user.faculty, lang) : '–'],
    [t('profile.memberSince'), formatDateTime(user.createdAt, lang, { hour: undefined, minute: undefined })],
    [t('profile.lastLogin'), user.lastLoginAt ? formatDateTime(user.lastLoginAt, lang) : '–']
  ];

  return (
    <>
      <PageHead title={t('profile.title')} subtitle={t('profile.subtitle')} />
      <div className="stack">
        <Card>
          <div className="profile-hero">
            <Avatar user={user} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2>{user.username}</h2>
              <div className="row" style={{ marginTop: 6 }}>
                <Badge variant="primary">{t(`roles.${user.role}`)}</Badge>
                {user.phoneVerified && <Badge variant="success">{t('profile.phoneVerified')}</Badge>}
              </div>
            </div>
            <ImageUpload
              label={t('profile.photo')}
              value={user.avatarPath}
              round
              removable={false}
              upload={(file) => userApi.uploadAvatar(file)}
              extractPath={(r) => r?.avatarPath}
              onChange={(_path, result) => result && setUser(result)}
            />
          </div>
        </Card>

        <div className="grid grid--2">
          <Card>
            <CardHeader title={t('profile.details')} />
            <dl className="detail-list">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="muted sm" style={{ marginTop: 16 }}>{t('profile.lockedNote')}</p>
          </Card>
          <Card>
            <CardHeader title={t('profile.edit')} subtitle={t('profile.editSubtitle')} actions={<Pencil size={16} aria-hidden="true" className="faint" />} />
            <ProfileForm user={user} onSaved={setUser} />
          </Card>
        </div>

        <Card>
          <CardHeader title={t('profile.security')} />
          <PasswordChange />
        </Card>
      </div>
    </>
  );
}
