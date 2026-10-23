import { useMemo, useState } from 'react';
import { Plus, Save, Send, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api.js';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { errorText, fieldErrors } from '../../utils/errors.js';
import { isoToZonedInput, zonedInputToIso } from '../../utils/format.js';
import { facultyName } from '../../utils/names.js';
import { Button } from '../common/Button.jsx';
import { Card, CardHeader } from '../common/Card.jsx';
import { Alert } from '../common/Feedback.jsx';
import { SelectField, SwitchField, TextField, TextareaField } from './Fields.jsx';
import { ImageUpload } from './ImageUpload.jsx';

const SENSITIVE = ['eventType', 'clubId', 'question', 'eligibleFacultyId', 'options', 'allowDelegatedVoting', 'startTime'];
const blankOption = () => ({ title: '', description: '', imagePath: null });

function initialState({ event, mode, clubs }) {
  if (event) {
    return {
      eventType: event.eventType,
      clubId: event.clubId ? String(event.clubId) : '',
      category: event.category ?? 'general',
      title: event.title ?? '',
      description: event.description ?? '',
      question: event.question ?? '',
      coverImagePath: event.coverImagePath ?? null,
      startTime: isoToZonedInput(event.startTime),
      endTime: isoToZonedInput(event.endTime),
      resultsPolicy: event.resultsPolicy ?? 'manual',
      eligibleFacultyId: event.eligibleFacultyId ? String(event.eligibleFacultyId) : '',
      allowDelegatedVoting: Boolean(event.allowDelegatedVoting),
      options: event.options.map((o) => ({ title: o.title ?? '', description: o.description ?? '', imagePath: o.imagePath ?? null }))
    };
  }
  const start = new Date(Date.now() + 3600_000);
  start.setMinutes(0, 0, 0);
  return {
    eventType: mode === 'manager' ? 'club' : 'university',
    clubId: mode === 'manager' && clubs.length === 1 ? String(clubs[0].id) : '',
    category: 'general',
    title: '',
    description: '',
    question: '',
    coverImagePath: null,
    startTime: isoToZonedInput(start.toISOString()),
    endTime: isoToZonedInput(new Date(start.getTime() + 7 * 86400_000).toISOString()),
    resultsPolicy: 'manual',
    eligibleFacultyId: '',
    allowDelegatedVoting: false,
    options: [blankOption(), blankOption()]
  };
}

const sameOptions = (a, b) => a.length === b.length && a.every((o, i) => o.title.trim() === (b[i].title ?? '') && (o.description || '') === (b[i].description || '') && (o.imagePath || null) === (b[i].imagePath || null));

/**
 * Create / edit form shared by Admin and Club Manager.
 * mode='manager' fixes the type to "club" and limits clubs to the ones the Admin granted.
 * On edit only the changed fields are sent, and a published event asks for explicit confirmation.
 */
export function EventForm({ mode, event = null, clubs, faculties = [], api, uploadOptionImage, uploadCoverImage, onSaved, cancelTo }) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const toast = useToast();
  const confirm = useConfirm();
  const editing = Boolean(event);
  const locked = editing && event.status === 'published' && event.hasVotes; // votes exist: sensitive fields frozen
  const [form, setForm] = useState(() => initialState({ event, mode, clubs }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const isClub = form.eventType === 'club';

  const setOptionCount = (n) =>
    setForm((f) => {
      const next = f.options.slice(0, n);
      while (next.length < n) next.push(blankOption());
      return { ...f, options: next };
    });
  const setOption = (index, patch) => setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === index ? { ...o, ...patch } : o)) }));

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 3) e.title = t('validation.required');
    if (form.question.trim().length < 5) e.question = t('validation.required');
    if (form.category.trim().length < 2) e.category = t('validation.required');
    if (isClub && !form.clubId) e.clubId = t('validation.clubRequired');
    const start = zonedInputToIso(form.startTime);
    const end = zonedInputToIso(form.endTime);
    if (!start) e.startTime = t('validation.date');
    if (!end) e.endTime = t('validation.date');
    if (start && end && new Date(end) <= new Date(start)) e.endTime = t('validation.endAfterStart');
    form.options.forEach((o, i) => {
      if (!o.title.trim()) e[`options.${i}.title`] = t('validation.required');
    });
    return e;
  };

  const payloadOptions = () => form.options.map((o) => ({ title: o.title.trim(), description: o.description.trim() || null, imagePath: o.imagePath || null }));

  const buildCreate = (publish) => ({
    eventType: mode === 'manager' ? 'club' : form.eventType,
    clubId: isClub ? Number(form.clubId) : null,
    category: form.category.trim(),
    title: form.title.trim(),
    description: form.description.trim() || null,
    question: form.question.trim(),
    coverImagePath: form.coverImagePath || null,
    startTime: zonedInputToIso(form.startTime),
    endTime: zonedInputToIso(form.endTime),
    resultsPolicy: form.resultsPolicy,
    eligibleFacultyId: form.eligibleFacultyId ? Number(form.eligibleFacultyId) : null,
    allowDelegatedVoting: isClub ? form.allowDelegatedVoting : false,
    options: payloadOptions(),
    publish
  });

  const buildDiff = () => {
    const original = initialState({ event, mode, clubs });
    const diff = {};
    const simple = ['category', 'title', 'description', 'question', 'resultsPolicy'];
    for (const key of simple) if (String(form[key]).trim() !== String(original[key]).trim()) diff[key] = key === 'description' ? form[key].trim() || null : form[key].trim();
    if ((form.coverImagePath || null) !== (original.coverImagePath || null)) diff.coverImagePath = form.coverImagePath || null;
    if (form.startTime !== original.startTime) diff.startTime = zonedInputToIso(form.startTime);
    if (form.endTime !== original.endTime) diff.endTime = zonedInputToIso(form.endTime);
    if (form.eventType !== original.eventType) diff.eventType = form.eventType;
    if (form.clubId !== original.clubId) diff.clubId = isClub ? Number(form.clubId) : null;
    if (form.eligibleFacultyId !== original.eligibleFacultyId) diff.eligibleFacultyId = form.eligibleFacultyId ? Number(form.eligibleFacultyId) : null;
    if (form.allowDelegatedVoting !== original.allowDelegatedVoting) diff.allowDelegatedVoting = form.allowDelegatedVoting;
    if (!sameOptions(form.options, original.options)) diff.options = payloadOptions();
    return diff;
  };

  const submit = async (publish = false) => {
    const found = validate();
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) {
      setFormError(t('errors.validation_error'));
      return;
    }
    setBusy(true);
    try {
      if (!editing) {
        const created = await api.create(buildCreate(publish));
        toast.success(publish ? t('eventForm.createdPublished') : t('eventForm.createdDraft'));
        onSaved(created);
        return;
      }
      const diff = buildDiff();
      if (!Object.keys(diff).length) {
        toast.info(t('eventForm.nothingChanged'));
        return;
      }
      try {
        onSaved(await api.update(event.id, diff));
      } catch (err) {
        if (err instanceof ApiError && err.code === 'confirmation_required') {
          const ok = await confirm({
            title: t('eventForm.confirmPublishedTitle'),
            text: t('eventForm.confirmPublishedText', { fields: (err.details?.fields ?? Object.keys(diff)).map((f) => t(`eventForm.fields.${f}`, { defaultValue: f })).join(', ') }),
            confirmLabel: t('eventForm.applyChanges')
          });
          if (!ok) return;
          onSaved(await api.update(event.id, { ...diff, confirm: true }));
        } else {
          throw err;
        }
      }
      toast.success(t('eventForm.updated'));
    } catch (err) {
      const mapped = fieldErrors(t, err);
      if (Object.keys(mapped).length) setErrors(mapped);
      if (err instanceof ApiError && err.code === 'event_has_votes') {
        const fields = (err.details?.fields ?? []).map((f) => t(`eventForm.fields.${f}`, { defaultValue: f })).join(', ');
        setFormError(`${errorText(t, err)} (${fields})`);
      } else {
        setFormError(errorText(t, err));
      }
    } finally {
      setBusy(false);
    }
  };

  const clubChoices = useMemo(() => clubs ?? [], [clubs]);

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      noValidate
    >
      {formError && <Alert variant="danger">{formError}</Alert>}
      {locked && <Alert variant="warning">{t('eventForm.lockedNotice')}</Alert>}

      <Card>
        <CardHeader title={t('eventForm.basics')} />
        <div className="form-grid">
          {mode === 'admin' && (
            <SelectField label={t('eventForm.type')} value={form.eventType} onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value, clubId: '', allowDelegatedVoting: false }))} disabled={locked}>
              <option value="university">{t('eventForm.typeUniversity')}</option>
              <option value="club">{t('eventForm.typeClub')}</option>
            </SelectField>
          )}
          {isClub && (
            <SelectField label={t('eventForm.club')} value={form.clubId} onChange={set('clubId')} error={errors.clubId} disabled={locked || (editing && mode === 'manager')}>
              <option value="">{t('eventForm.chooseClub')}</option>
              {clubChoices.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
          )}
          <TextField label={t('eventForm.title')} className="span-2" value={form.title} onChange={set('title')} error={errors.title} maxLength={160} />
          <TextField label={t('eventForm.category')} value={form.category} onChange={set('category')} error={errors.category} maxLength={60} hint={t('eventForm.categoryHint')} />
          <SelectField label={t('eventForm.faculty')} value={form.eligibleFacultyId} onChange={set('eligibleFacultyId')} disabled={locked} hint={t('eventForm.facultyHint')}>
            <option value="">{t('eventForm.allFaculties')}</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>
                {facultyName(f, lang)}
              </option>
            ))}
          </SelectField>
          <TextareaField label={t('eventForm.description')} className="span-2" value={form.description} onChange={set('description')} error={errors.description} optional maxLength={4000} />
          <TextField label={t('eventForm.question')} className="span-2" value={form.question} onChange={set('question')} error={errors.question} maxLength={300} disabled={locked} hint={t('eventForm.questionHint')} />
          {uploadCoverImage && (
            <div className="span-2">
              <ImageUpload label={t('eventForm.cover')} value={form.coverImagePath} onChange={(path) => setForm((f) => ({ ...f, coverImagePath: path }))} upload={uploadCoverImage} />
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title={t('eventForm.schedule')} subtitle={t('eventForm.scheduleHint', { tz: 'Africa/Cairo' })} />
        <div className="form-grid">
          <TextField label={t('eventForm.start')} type="datetime-local" value={form.startTime} onChange={set('startTime')} error={errors.startTime} disabled={locked} dir="ltr" />
          <TextField label={t('eventForm.end')} type="datetime-local" value={form.endTime} onChange={set('endTime')} error={errors.endTime} dir="ltr" />
          <SelectField label={t('eventForm.resultsPolicy')} className="span-2" value={form.resultsPolicy} onChange={set('resultsPolicy')} hint={t('eventForm.resultsPolicyHint')}>
            <option value="manual">{t('eventForm.policyManual')}</option>
            <option value="auto_on_close">{t('eventForm.policyAuto')}</option>
          </SelectField>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={t('eventForm.options')}
          subtitle={t('eventForm.optionsHint')}
          actions={
            <div className="option-count" role="group" aria-label={t('eventForm.optionCount')}>
              {[2, 3, 4].map((n) => (
                <button key={n} type="button" aria-pressed={form.options.length === n} onClick={() => setOptionCount(n)} disabled={locked}>
                  {n}
                </button>
              ))}
            </div>
          }
        />
        <div className="stack" style={{ gap: 14 }}>
          {form.options.map((option, index) => (
            <fieldset key={index} className="option-editor" style={{ margin: 0 }} disabled={locked}>
              <legend className="sr-only">{t('eventForm.optionN', { n: index + 1 })}</legend>
              <div className="option-editor__head">
                <span>{t('eventForm.optionN', { n: index + 1 })}</span>
                {form.options.length > 2 && !locked && (
                  <Button size="sm" variant="ghost" onClick={() => setOptionCount(form.options.length - 1)} aria-label={t('eventForm.removeLast')}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              </div>
              <div className="option-editor__grid">
                <div className="form-stack">
                  <TextField label={t('eventForm.optionTitle')} value={option.title} onChange={(e) => setOption(index, { title: e.target.value })} error={errors[`options.${index}.title`]} maxLength={120} />
                  <TextField label={t('eventForm.optionDescription')} value={option.description} onChange={(e) => setOption(index, { description: e.target.value })} optional maxLength={500} />
                </div>
                <ImageUpload label={t('eventForm.optionImage')} value={option.imagePath} onChange={(path) => setOption(index, { imagePath: path })} upload={uploadOptionImage} disabled={locked} />
              </div>
            </fieldset>
          ))}
          {form.options.length < 4 && !locked && (
            <Button onClick={() => setOptionCount(form.options.length + 1)}>
              <Plus aria-hidden="true" /> {t('eventForm.addOption')}
            </Button>
          )}
        </div>
      </Card>

      {isClub && (
        <Card>
          <CardHeader title={t('eventForm.delegated')} />
          <SwitchField label={t('eventForm.allowDelegated')} description={t('eventForm.allowDelegatedHint')} checked={form.allowDelegatedVoting} onChange={(checked) => setForm((f) => ({ ...f, allowDelegatedVoting: checked }))} disabled={locked} />
        </Card>
      )}

      <div className="form-actions">
        {editing ? (
          <Button type="submit" variant="primary" loading={busy}>
            <Save aria-hidden="true" /> {t('common.saveChanges')}
          </Button>
        ) : (
          <>
            <Button type="submit" loading={busy}>
              <Save aria-hidden="true" /> {t('eventForm.saveDraft')}
            </Button>
            <Button variant="primary" loading={busy} onClick={() => submit(true)}>
              <Send aria-hidden="true" className="flip-rtl" /> {t('eventForm.saveAndPublish')}
            </Button>
          </>
        )}
        <Button variant="ghost" to={cancelTo}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
