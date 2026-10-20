import { useEffect, useState } from 'react';
import { Pencil, Plus, Power, Search, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi, referenceApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { errorText, fieldErrors } from '../../utils/errors.js';
import { formatDateTime } from '../../utils/format.js';
import { facultyName } from '../../utils/names.js';
import * as v from '../../utils/validation.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Avatar, Badge, PageHead, Pagination } from '../../components/common/Display.jsx';
import { Alert, EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { PasswordField, SelectField, TextField } from '../../components/forms/Fields.jsx';

function UserModal({ open, onClose, onSaved, user, faculties }) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const toast = useToast();
  const editing = Boolean(user);
  const blank = { username: '', email: '', phone: '', studentId: '', facultyId: '', password: '', role: 'student' };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError('');
    setForm(user ? { ...blank, username: user.username, email: user.email, facultyId: user.facultyId ? String(user.facultyId) : '', role: user.role } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const checks = editing
      ? { username: v.username(form.username), email: v.email(form.email) }
      : {
          username: v.username(form.username),
          email: v.email(form.email),
          phone: v.phone(form.phone),
          studentId: form.role === 'admin' && !form.studentId ? null : v.studentId(form.studentId),
          password: v.password(form.password)
        };
    const found = v.collect(checks);
    setErrors(Object.fromEntries(Object.entries(found).map(([k, key]) => [k, t(key)])));
    setFormError('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      if (editing) {
        const body = {};
        if (form.username.trim() !== user.username) body.username = form.username.trim();
        if (form.email.trim().toLowerCase() !== user.email) body.email = form.email.trim();
        if (form.facultyId && Number(form.facultyId) !== user.facultyId) body.facultyId = Number(form.facultyId);
        if (form.role !== user.role && user.role !== 'club_manager') body.role = form.role;
        if (Object.keys(body).length) await adminApi.updateUser(user.id, body);
      } else {
        await adminApi.createUser({
          username: form.username.trim(),
          email: form.email.trim(),
          phone: v.westernDigits(form.phone).trim(),
          studentId: form.studentId ? v.westernDigits(form.studentId).trim() : null,
          facultyId: form.facultyId ? Number(form.facultyId) : null,
          password: form.password,
          role: form.role
        });
      }
      toast.success(editing ? t('admin.users.updated') : t('admin.users.created'));
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
    <Modal open={open} onClose={onClose} title={editing ? t('admin.users.editTitle') : t('admin.users.createTitle')} wide closeOnBackdrop={false}>
      <form className="form-stack" onSubmit={submit} noValidate>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <div className="form-grid">
          <TextField label={t('auth.username')} value={form.username} onChange={set('username')} error={errors.username} data-autofocus />
          <TextField label={t('auth.email')} type="email" dir="ltr" value={form.email} onChange={set('email')} error={errors.email} />
          {!editing && <TextField label={t('auth.phone')} type="tel" dir="ltr" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="01XXXXXXXXX" />}
          {!editing && <TextField label={t('auth.studentId')} dir="ltr" value={form.studentId} onChange={set('studentId')} error={errors.studentId} optional={form.role === 'admin'} />}
          <SelectField label={t('auth.faculty')} value={form.facultyId} onChange={set('facultyId')} error={errors.facultyId} optional={form.role === 'admin'}>
            <option value="">{t('auth.facultyPlaceholder')}</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {facultyName(f, lang)}
              </option>
            ))}
          </SelectField>
          <SelectField label={t('admin.users.role')} value={form.role} onChange={set('role')} disabled={editing && user.role === 'club_manager'} hint={editing && user.role === 'club_manager' ? t('admin.users.managerRoleHint') : undefined}>
            <option value="student">{t('roles.student')}</option>
            <option value="admin">{t('roles.admin')}</option>
            {editing && user.role === 'club_manager' && <option value="club_manager">{t('roles.club_manager')}</option>}
          </SelectField>
          {!editing && <PasswordField label={t('auth.password')} className="span-2" value={form.password} onChange={set('password')} error={errors.password} showStrength autoComplete="new-password" hint={t('auth.passwordHint')} />}
        </div>
        <div className="modal__actions">
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" loading={busy}>
            {editing ? t('common.saveChanges') : t('admin.users.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { user: me } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  useDocumentTitle(t('nav.users'));

  const [filters, setFilters] = useState({ search: '', role: '', status: '', facultyId: '' });
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, user: null });
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(filters.search.trim()), 300);
    return () => clearTimeout(id);
  }, [filters.search]);
  useEffect(() => setPage(1), [debounced, filters.role, filters.status, filters.facultyId]);

  const faculties = useApi(() => referenceApi.faculties(), []);
  const { data, loading, error, reload } = useApi(
    () => adminApi.users({ page, pageSize: 15, search: debounced, role: filters.role, status: filters.status, facultyId: filters.facultyId }),
    [page, debounced, filters.role, filters.status, filters.facultyId]
  );
  const rows = data?.items ?? [];

  const act = async (fn, successKey) => {
    setNotice('');
    try {
      await fn();
      toast.success(t(successKey));
      reload({ silent: true });
    } catch (err) {
      setNotice(errorText(t, err));
    }
  };

  const toggleActive = async (u) => {
    if (u.isActive) {
      const ok = await confirm({ title: t('admin.users.deactivateTitle', { name: u.username }), text: t('admin.users.deactivateText'), confirmLabel: t('admin.users.deactivate'), danger: true });
      if (!ok) return;
    }
    act(() => adminApi.updateUser(u.id, { isActive: !u.isActive }), u.isActive ? 'admin.users.deactivated' : 'admin.users.activated');
  };

  const remove = async (u) => {
    const ok = await confirm({ title: t('admin.users.removeTitle', { name: u.username }), text: t('admin.users.removeText'), confirmLabel: t('common.delete'), danger: true });
    if (!ok) return;
    act(() => adminApi.removeUser(u.id), 'admin.users.removed');
  };

  return (
    <>
      <PageHead
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle')}
        actions={
          <Button variant="primary" onClick={() => setModal({ open: true, user: null })}>
            <Plus aria-hidden="true" /> {t('admin.users.add')}
          </Button>
        }
      />
      <div className="toolbar">
        <div className="input-icon">
          <Search aria-hidden="true" />
          <input className="input" type="search" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder={t('admin.users.search')} aria-label={t('admin.users.search')} />
        </div>
        <select className="select" value={filters.role} onChange={(e) => setFilters((f) => ({ ...f, role: e.target.value }))} aria-label={t('admin.users.role')}>
          <option value="">{t('admin.users.allRoles')}</option>
          <option value="student">{t('roles.student')}</option>
          <option value="club_manager">{t('roles.club_manager')}</option>
          <option value="admin">{t('roles.admin')}</option>
        </select>
        <select className="select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} aria-label={t('admin.events.status')}>
          <option value="">{t('admin.users.allStatuses')}</option>
          <option value="active">{t('admin.users.active')}</option>
          <option value="inactive">{t('admin.users.inactive')}</option>
        </select>
        <select className="select" value={filters.facultyId} onChange={(e) => setFilters((f) => ({ ...f, facultyId: e.target.value }))} aria-label={t('auth.faculty')}>
          <option value="">{t('admin.users.allFaculties')}</option>
          {(faculties.data ?? []).map((f) => (
            <option key={f.id} value={f.id}>
              {facultyName(f, lang)}
            </option>
          ))}
        </select>
      </div>
      {notice && (
        <div style={{ marginBottom: 14 }}>
          <Alert variant="danger">{notice}</Alert>
        </div>
      )}
      {loading && !data ? (
        <ListSkeleton rows={5} height={56} />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title={t('admin.users.emptyTitle')} text={t('admin.users.emptyText')} />
        </Card>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t('admin.users.user')}</th>
                  <th scope="col">{t('auth.studentId')}</th>
                  <th scope="col">{t('auth.faculty')}</th>
                  <th scope="col">{t('admin.users.role')}</th>
                  <th scope="col">{t('admin.events.status')}</th>
                  <th scope="col">{t('admin.users.lastLogin')}</th>
                  <th scope="col">
                    <span className="sr-only">{t('common.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const self = u.id === me.id;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="cell-user">
                          <Avatar user={u} />
                          <div>
                            <span className="bold">{u.username}</span>
                            {self && <> <Badge variant="primary" plain>{t('admin.users.you')}</Badge></>}
                            <small className="ltr">{u.email}</small>
                          </div>
                        </div>
                      </td>
                      <td className="ltr num">{u.studentId ?? '–'}</td>
                      <td>{u.facultyNameEn ? facultyName({ nameEn: u.facultyNameEn, nameAr: u.facultyNameAr }, lang) : '–'}</td>
                      <td>
                        <Badge variant={u.role === 'admin' ? 'danger' : u.role === 'club_manager' ? 'info' : ''} plain>
                          {t(`roles.${u.role}`)}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={u.isActive ? 'success' : 'warning'}>{u.isActive ? t('admin.users.active') : t('admin.users.inactive')}</Badge>
                      </td>
                      <td className="sm muted">{u.lastLoginAt ? formatDateTime(u.lastLoginAt, lang) : '–'}</td>
                      <td>
                        <div className="actions">
                          <Button size="sm" variant="ghost" icon onClick={() => setModal({ open: true, user: u })} disabled={self} aria-label={t('common.edit')} title={t('common.edit')}>
                            <Pencil aria-hidden="true" />
                          </Button>
                          <Button size="sm" variant="ghost" icon onClick={() => toggleActive(u)} disabled={self} aria-label={u.isActive ? t('admin.users.deactivate') : t('admin.users.activate')} title={u.isActive ? t('admin.users.deactivate') : t('admin.users.activate')}>
                            <Power aria-hidden="true" />
                          </Button>
                          <Button size="sm" variant="ghost" icon onClick={() => remove(u)} disabled={self} aria-label={t('common.delete')} title={t('common.delete')}>
                            <Trash2 aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}
      <UserModal open={modal.open} user={modal.user} faculties={faculties.data ?? []} onClose={() => setModal({ open: false, user: null })} onSaved={() => reload({ silent: true })} />
    </>
  );
}

