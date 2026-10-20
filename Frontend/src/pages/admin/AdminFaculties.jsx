import { useEffect, useState } from 'react';
import { GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
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
import { Badge, PageHead } from '../../components/common/Display.jsx';
import { Alert, EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { SwitchField, TextField } from '../../components/forms/Fields.jsx';

function FacultyModal({ open, faculty, onClose, onSaved }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState({ nameEn: '', nameAr: '', sortOrder: 0, isActive: true });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError('');
    setForm(faculty ? { nameEn: faculty.nameEn, nameAr: faculty.nameAr ?? '', sortOrder: faculty.sortOrder, isActive: faculty.isActive } : { nameEn: '', nameAr: '', sortOrder: 0, isActive: true });
  }, [open, faculty]);

  const submit = async (event) => {
    event.preventDefault();
    if (form.nameEn.trim().length < 3) {
      setErrors({ nameEn: t('validation.required') });
      return;
    }
    setBusy(true);
    setFormError('');
    try {
      const body = { nameEn: form.nameEn.trim(), nameAr: form.nameAr.trim() || null, sortOrder: Number(form.sortOrder) || 0, isActive: form.isActive };
      if (faculty) await adminApi.updateFaculty(faculty.id, body);
      else await adminApi.createFaculty(body);
      toast.success(faculty ? t('admin.faculties.updated') : t('admin.faculties.created'));
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
    <Modal open={open} onClose={onClose} title={faculty ? t('admin.faculties.editTitle') : t('admin.faculties.createTitle')} closeOnBackdrop={false}>
      <form className="form-stack" onSubmit={submit} noValidate>
        {formError && <Alert variant="danger">{formError}</Alert>}
        <TextField label={t('admin.faculties.nameEn')} value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} error={errors.nameEn} data-autofocus dir="ltr" />
        <TextField label={t('admin.faculties.nameAr')} value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} error={errors.nameAr} optional dir="rtl" lang="ar" />
        <TextField label={t('admin.faculties.order')} type="number" min="0" max="1000" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} error={errors.sortOrder} dir="ltr" />
        <SwitchField label={t('admin.faculties.active')} description={t('admin.faculties.activeHint')} checked={form.isActive} onChange={(isActive) => setForm((f) => ({ ...f, isActive }))} />
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

export default function AdminFaculties() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const toast = useToast();
  const confirm = useConfirm();
  useDocumentTitle(t('nav.faculties'));
  const { data, loading, error, reload } = useApi(() => adminApi.faculties(), []);
  const [modal, setModal] = useState({ open: false, faculty: null });
  const [notice, setNotice] = useState('');

  const remove = async (f) => {
    const ok = await confirm({ title: t('admin.faculties.deleteTitle', { name: f.nameEn }), text: t('admin.faculties.deleteText'), confirmLabel: t('common.delete'), danger: true });
    if (!ok) return;
    setNotice('');
    try {
      await adminApi.deleteFaculty(f.id);
      toast.success(t('admin.faculties.deleted'));
      reload({ silent: true });
    } catch (err) {
      setNotice(errorText(t, err));
    }
  };

  return (
    <>
      <PageHead
        title={t('admin.faculties.title')}
        subtitle={t('admin.faculties.subtitle')}
        actions={
          <Button variant="primary" onClick={() => setModal({ open: true, faculty: null })}>
            <Plus aria-hidden="true" /> {t('admin.faculties.add')}
          </Button>
        }
      />
      {notice && (
        <div style={{ marginBottom: 14 }}>
          <Alert variant="danger">{notice}</Alert>
        </div>
      )}
      {loading && !data ? (
        <ListSkeleton rows={5} height={52} />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={GraduationCap} title={t('admin.faculties.emptyTitle')} />
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('admin.faculties.order')}</th>
                <th scope="col">{t('admin.faculties.nameEn')}</th>
                <th scope="col">{t('admin.faculties.nameAr')}</th>
                <th scope="col">{t('admin.faculties.users')}</th>
                <th scope="col">{t('admin.events.status')}</th>
                <th scope="col">
                  <span className="sr-only">{t('common.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((f) => (
                <tr key={f.id}>
                  <td className="num">{formatNumber(f.sortOrder, lang)}</td>
                  <td className="bold">{f.nameEn}</td>
                  <td lang="ar" dir="rtl">{f.nameAr || '–'}</td>
                  <td className="num">{formatNumber(f.userCount, lang)}</td>
                  <td>
                    <Badge variant={f.isActive ? 'success' : ''}>{f.isActive ? t('admin.users.active') : t('admin.users.inactive')}</Badge>
                  </td>
                  <td>
                    <div className="actions">
                      <Button size="sm" variant="ghost" icon aria-label={t('common.edit')} title={t('common.edit')} onClick={() => setModal({ open: true, faculty: f })}>
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button size="sm" variant="ghost" icon aria-label={t('common.delete')} title={t('common.delete')} onClick={() => remove(f)}>
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FacultyModal open={modal.open} faculty={modal.faculty} onClose={() => setModal({ open: false, faculty: null })} onSaved={() => reload({ silent: true })} />
    </>
  );
}

