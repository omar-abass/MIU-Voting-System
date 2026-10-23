import { useEffect, useState } from 'react';
import { CalendarCheck, Pencil, Plus, Search, UserPlus, Users, Vote, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { errorText, fieldErrors } from '../../utils/errors.js';
import { formatNumber } from '../../utils/format.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Avatar, Badge, LogoImage, PageHead } from '../../components/common/Display.jsx';
import { Alert, EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { SwitchField, TextField, TextareaField } from '../../components/forms/Fields.jsx';
import { ImageUpload } from '../../components/forms/ImageUpload.jsx';

function ClubModal({ open, club, onClose, onSaved }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', description: '', logoPath: null, isActive: true });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError('');
    setForm(club ? { name: club.name, description: club.description ?? '', logoPath: club.logoPath, isActive: club.isActive } : { name: '', description: '', logoPath: null, isActive: true });
  }, [open, club]);

  const submit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setErrors({ name: t('validation.required') });
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      const body = { name: form.name.trim(), description: form.description.trim() || null, logoPath: form.logoPath || null, isActive: form.isActive };
      if (club) await adminApi.updateClub(club.id, body);
      else await adminApi.createClub(body);
      toast.success(club ? t('admin.clubs.updated') : t('admin.clubs.created'));
      onSaved();
      onClose();
    } catch (err) {
      const mapped = fieldErrors(t, err);
      if (Object.keys(mapped).length) setErrors(mapped);
      setFormError(errorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={club ? t('admin.clubs.editTitle') : t('admin.clubs.createTitle')} closeOnBackdrop={false}>
      <form className="form-stack" onSubmit={submit} noValidate>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <TextField label={t('admin.clubs.name')} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} maxLength={120} data-autofocus />
        <TextareaField label={t('admin.clubs.description')} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} error={errors.description} maxLength={1000} optional />
        <ImageUpload label={t('admin.clubs.logo')} value={form.logoPath} onChange={(logoPath) => setForm((f) => ({ ...f, logoPath }))} upload={(file) => adminApi.uploadImage('clubs', file)} />
        <SwitchField label={t('admin.clubs.active')} description={t('admin.clubs.activeHint')} checked={form.isActive} onChange={(isActive) => setForm((f) => ({ ...f, isActive }))} />
        <div className="modal__actions">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" loading={busy}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Appoint a manager (or change their permissions). Search is by username/email/student ID. */
function ManagerModal({ open, club, existing, onClose, onSaved }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [picked, setPicked] = useState(null);
  const [perms, setPerms] = useState({ canCreateEvents: false, canDelegateVote: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setError('');
    setPicked(existing ? { id: existing.userId, username: existing.username } : null);
    setPerms({ canCreateEvents: Boolean(existing?.canCreateEvents), canDelegateVote: Boolean(existing?.canDelegateVote) });
  }, [open, existing]);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const results = useApi(() => adminApi.users({ search: debounced, pageSize: 8, status: 'active' }), [debounced], { enabled: open && !existing && debounced.length >= 2 });
  const candidates = (results.data?.items ?? []).filter((u) => u.role !== 'admin');

  const submit = async () => {
    if (!picked) return;
    setBusy(true);
    setError('');
    try {
      await adminApi.assignManager(club.id, picked.id, perms);
      toast.success(t('admin.clubs.managerSaved'));
      onSaved();
      onClose();
    } catch (err) {
      setError(errorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={existing ? t('admin.clubs.editManager', { name: existing.username }) : t('admin.clubs.assignTitle', { club: club?.name ?? '' })} closeOnBackdrop={false}>
      <div className="form-stack">
        {error && <Alert variant="danger">{error}</Alert>}
        {!existing && (
          <>
            <div className="input-icon">
              <Search aria-hidden="true" />
              <input className="input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.clubs.findUser')} aria-label={t('admin.clubs.findUser')} data-autofocus />
            </div>
            {debounced.length >= 2 && (
              <div className="options" role="radiogroup" aria-label={t('admin.clubs.findUser')} style={{ maxHeight: 220, overflowY: 'auto' }}>
                {candidates.map((u) => (
                  <label key={u.id} className="option-card" style={{ padding: '8px 12px' }}>
                    <input type="radio" name="manager" checked={picked?.id === u.id} onChange={() => setPicked(u)} />
                    <Avatar user={u} size={34} />
                    <span className="option-card__body">
                      <span className="option-card__title" style={{ display: 'block' }}>{u.username}</span>
                      <span className="option-card__desc ltr" style={{ display: 'block' }}>{u.email}</span>
                    </span>
                    <span className="option-card__radio" aria-hidden="true" />
                  </label>
                ))}
                {!results.loading && candidates.length === 0 && <p className="muted sm">{t('admin.clubs.noUsers')}</p>}
              </div>
            )}
          </>
        )}
        {picked && (
          <p className="bold">
            {t('admin.clubs.selected')}: {picked.username}
          </p>
        )}
        <SwitchField label={t('admin.clubs.canCreate')} description={t('admin.clubs.canCreateHint')} checked={perms.canCreateEvents} onChange={(canCreateEvents) => setPerms((p) => ({ ...p, canCreateEvents }))} />
        <SwitchField label={t('admin.clubs.canDelegate')} description={t('admin.clubs.canDelegateHint')} checked={perms.canDelegateVote} onChange={(canDelegateVote) => setPerms((p) => ({ ...p, canDelegateVote }))} />
        <div className="modal__actions">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={submit} loading={busy} disabled={!picked}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminClubs() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const toast = useToast();
  const confirm = useConfirm();
  useDocumentTitle(t('nav.clubs'));
  const { data, loading, error, reload } = useApi(() => adminApi.clubs(), []);
  const [clubModal, setClubModal] = useState({ open: false, club: null });
  const [managerModal, setManagerModal] = useState({ open: false, club: null, existing: null });
  const [notice, setNotice] = useState('');

  const revoke = async (club, m) => {
    const ok = await confirm({ title: t('admin.clubs.revokeTitle', { name: m.username }), text: t('admin.clubs.revokeText', { club: club.name }), confirmLabel: t('admin.clubs.revoke'), danger: true });
    if (!ok) return;
    setNotice('');
    try {
      await adminApi.revokeManager(club.id, m.userId);
      toast.success(t('admin.clubs.revoked'));
      reload({ silent: true });
    } catch (err) {
      setNotice(errorText(t, err));
    }
  };

  return (
    <>
      <PageHead
        title={t('admin.clubs.title')}
        subtitle={t('admin.clubs.subtitle')}
        actions={
          <Button variant="primary" onClick={() => setClubModal({ open: true, club: null })}>
            <Plus aria-hidden="true" /> {t('admin.clubs.add')}
          </Button>
        }
      />
      {notice && (
        <div style={{ marginBottom: 14 }}>
          <Alert variant="danger">{notice}</Alert>
        </div>
      )}
      {loading && !data ? (
        <ListSkeleton rows={3} height={180} />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title={t('admin.clubs.emptyTitle')} />
        </Card>
      ) : (
        <div className="grid grid--auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {data.map((club) => (
            <Card key={club.id} className="club-card">
              <div className="club-card__top">
                <div className="club-card__logo">
                  <LogoImage path={club.logoPath} name={club.name} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3>{club.name}</h3>
                  <Badge variant={club.isActive ? 'success' : ''}>{club.isActive ? t('admin.users.active') : t('admin.users.inactive')}</Badge>
                </div>
                <Button size="sm" variant="ghost" icon aria-label={t('common.edit')} title={t('common.edit')} onClick={() => setClubModal({ open: true, club })}>
                  <Pencil aria-hidden="true" />
                </Button>
              </div>
              <p>{club.description || t('clubs.noDescription')}</p>
              <div className="row" style={{ gap: 16 }}>
                <span className="muted sm">
                  <Users size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('manager.subscribers', { n: formatNumber(club.subscribers, lang) })}
                </span>
                <span className="muted sm">
                  <CalendarCheck size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('admin.clubs.events', { n: formatNumber(club.eventsTotal, lang) })}
                </span>
                <span className="muted sm">
                  <Vote size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('admin.clubs.votes', { n: formatNumber(club.votesCast, lang) })}
                </span>
              </div>
              <div>
                <div className="faint sm bold" style={{ marginBottom: 8 }}>{t('admin.clubs.managers')}</div>
                <div className="chip-list">
                  {club.managers.length === 0 && <span className="muted sm">{t('admin.clubs.noManagers')}</span>}
                  {club.managers.map((m) => (
                    <span className="manager-chip" key={m.userId}>
                      <button
                        type="button"
                        style={{ width: 'auto', padding: '0 4px', borderRadius: 6 }}
                        onClick={() => setManagerModal({ open: true, club, existing: m })}
                        aria-label={t('admin.clubs.editManager', { name: m.username })}
                        title={[m.canCreateEvents ? t('manager.canCreate') : t('manager.viewOnly'), m.canDelegateVote ? t('manager.canDelegate') : null].filter(Boolean).join(' · ')}
                      >
                        {m.username}
                      </button>
                      <button type="button" onClick={() => revoke(club, m)} aria-label={t('admin.clubs.revokeTitle', { name: m.username })}>
                        <X aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <Button onClick={() => setManagerModal({ open: true, club, existing: null })}>
                <UserPlus aria-hidden="true" /> {t('admin.clubs.assign')}
              </Button>
            </Card>
          ))}
        </div>
      )}
      <ClubModal open={clubModal.open} club={clubModal.club} onClose={() => setClubModal({ open: false, club: null })} onSaved={() => reload({ silent: true })} />
      <ManagerModal open={managerModal.open} club={managerModal.club} existing={managerModal.existing} onClose={() => setManagerModal({ open: false, club: null, existing: null })} onSaved={() => reload({ silent: true })} />
    </>
  );
}

