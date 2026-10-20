import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Save, Send, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../../services/api.js';
import { adminApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { errorText, fieldErrors } from '../../utils/errors.js';
import { isoToZonedInput, zonedInputToIso } from '../../utils/format.js';
import { Button } from '../../components/common/Button.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { PageHead } from '../../components/common/Display.jsx';
import { Alert, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { SelectField, SwitchField, TextField, TextareaField } from '../../components/forms/Fields.jsx';
import { ImageUpload } from '../../components/forms/ImageUpload.jsx';

const blankEntry = () => ({ clubId: '', imagePath: null });

function initialState(comp) {
  if (comp) {
    return {
      title: comp.title,
      description: comp.description ?? '',
      coverImagePath: comp.coverImagePath ?? null,
      startTime: isoToZonedInput(comp.startTime),
      endTime: isoToZonedInput(comp.endTime),
      resultsPolicy: comp.resultsPolicy ?? 'manual',
      liveResults: Boolean(comp.liveResults),
      clubs: comp.clubs.map((c) => ({ clubId: String(c.clubId), imagePath: c.imagePath && c.imagePath !== c.logoPath ? c.imagePath : null }))
    };
  }
  const start = new Date(Date.now() + 3600_000);
  start.setMinutes(0, 0, 0);
  return {
    title: '',
    description: '',
    coverImagePath: null,
    startTime: isoToZonedInput(start.toISOString()),
    endTime: isoToZonedInput(new Date(start.getTime() + 7 * 86400_000).toISOString()),
    resultsPolicy: 'manual',
    liveResults: false,
    clubs: [blankEntry(), blankEntry()]
  };
}

function CompetitionFormBody({ competition, clubs }) {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const editing = Boolean(competition);
  const locked = editing && competition.status === 'published' && competition.hasVotes;
  const [form, setForm] = useState(() => initialState(competition));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const setCount = (n) =>
    setForm((f) => {
      const next = f.clubs.slice(0, n);
      while (next.length < n) next.push(blankEntry());
      return { ...f, clubs: next };
    });
  const setEntry = (i, patch) => setForm((f) => ({ ...f, clubs: f.clubs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 3) e.title = t('validation.required');
    const start = zonedInputToIso(form.startTime);
    const end = zonedInputToIso(form.endTime);
    if (!start) e.startTime = t('validation.date');
    if (!end) e.endTime = t('validation.date');
    if (start && end && new Date(end) <= new Date(start)) e.endTime = t('validation.endAfterStart');
    const ids = form.clubs.map((c) => c.clubId);
    form.clubs.forEach((c, i) => {
      if (!c.clubId) e[`clubs.${i}.clubId`] = t('validation.required');
      else if (ids.indexOf(c.clubId) !== i) e[`clubs.${i}.clubId`] = t('validation.competitionClubsUnique');
    });
    return e;
  };

  const clubsPayload = () => form.clubs.map((c) => ({ clubId: Number(c.clubId), imagePath: c.imagePath || null }));

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
        const created = await adminApi.createCompetition({
          title: form.title.trim(),
          description: form.description.trim() || null,
          coverImagePath: form.coverImagePath || null,
          startTime: zonedInputToIso(form.startTime),
          endTime: zonedInputToIso(form.endTime),
          resultsPolicy: form.resultsPolicy,
          liveResults: form.liveResults,
          clubs: clubsPayload(),
          publish
        });
        toast.success(publish ? t('eventForm.createdPublished') : t('eventForm.createdDraft'));
        navigate(`/admin/competitions/${created.id}`);
        return;
      }
      const original = initialState(competition);
      const diff = {};
      if (form.title.trim() !== original.title) diff.title = form.title.trim();
      if (form.description.trim() !== original.description.trim()) diff.description = form.description.trim() || null;
      if ((form.coverImagePath || null) !== (original.coverImagePath || null)) diff.coverImagePath = form.coverImagePath || null;
      if (form.startTime !== original.startTime) diff.startTime = zonedInputToIso(form.startTime);
      if (form.endTime !== original.endTime) diff.endTime = zonedInputToIso(form.endTime);
      if (form.resultsPolicy !== original.resultsPolicy) diff.resultsPolicy = form.resultsPolicy;
      if (form.liveResults !== original.liveResults) diff.liveResults = form.liveResults;
      if (JSON.stringify(form.clubs) !== JSON.stringify(original.clubs)) diff.clubs = clubsPayload();
      if (!Object.keys(diff).length) {
        toast.info(t('eventForm.nothingChanged'));
        return;
      }
      try {
        await adminApi.updateCompetition(competition.id, diff);
      } catch (err) {
        if (err instanceof ApiError && err.code === 'confirmation_required') {
          const ok = await confirm({ title: t('eventForm.confirmPublishedTitle'), text: t('competitionForm.confirmPublishedText'), confirmLabel: t('eventForm.applyChanges') });
          if (!ok) return;
          await adminApi.updateCompetition(competition.id, { ...diff, confirm: true });
        } else {
          throw err;
        }
      }
      toast.success(t('eventForm.updated'));
      navigate(`/admin/competitions/${competition.id}`);
    } catch (err) {
      const mapped = fieldErrors(t, err);
      if (Object.keys(mapped).length) setErrors(mapped);
      setFormError(errorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  const chosen = form.clubs.map((c) => c.clubId);

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
          <TextField label={t('eventForm.title')} className="span-2" value={form.title} onChange={set('title')} error={errors.title} maxLength={160} />
          <TextareaField label={t('eventForm.description')} className="span-2" value={form.description} onChange={set('description')} optional maxLength={4000} />
          <div className="span-2">
            <ImageUpload label={t('eventForm.cover')} value={form.coverImagePath} onChange={(p) => setForm((f) => ({ ...f, coverImagePath: p }))} upload={(file) => adminApi.uploadImage('competitions', file)} />
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader title={t('eventForm.schedule')} subtitle={t('eventForm.scheduleHint', { tz: 'Africa/Cairo' })} />
        <div className="form-grid">
          <TextField label={t('eventForm.start')} type="datetime-local" dir="ltr" value={form.startTime} onChange={set('startTime')} error={errors.startTime} disabled={locked} />
          <TextField label={t('eventForm.end')} type="datetime-local" dir="ltr" value={form.endTime} onChange={set('endTime')} error={errors.endTime} />
          <SelectField label={t('eventForm.resultsPolicy')} value={form.resultsPolicy} onChange={set('resultsPolicy')} hint={t('eventForm.resultsPolicyHint')}>
            <option value="manual">{t('eventForm.policyManual')}</option>
            <option value="auto_on_close">{t('eventForm.policyAuto')}</option>
          </SelectField>
          <div style={{ alignSelf: 'center' }}>
            <SwitchField label={t('competitionForm.live')} description={t('competitionForm.liveHint')} checked={form.liveResults} onChange={(liveResults) => setForm((f) => ({ ...f, liveResults }))} />
          </div>
        </div>
      </Card>
      <Card>
        <CardHeader
          title={t('competitionForm.contenders')}
          subtitle={t('competitionForm.contendersHint')}
          actions={
            <div className="option-count" role="group" aria-label={t('competitionForm.count')}>
              {[2, 3, 4].map((n) => (
                <button key={n} type="button" aria-pressed={form.clubs.length === n} onClick={() => setCount(n)} disabled={locked}>
                  {n}
                </button>
              ))}
            </div>
          }
        />
        <div className="stack" style={{ gap: 14 }}>
          {form.clubs.map((entry, index) => (
            <fieldset key={index} className="option-editor" style={{ margin: 0 }} disabled={locked}>
              <legend className="sr-only">{t('competitionForm.contenderN', { n: index + 1 })}</legend>
              <div className="option-editor__head">
                <span>{t('competitionForm.contenderN', { n: index + 1 })}</span>
                {form.clubs.length > 2 && !locked && (
                  <Button size="sm" variant="ghost" onClick={() => setCount(form.clubs.length - 1)} aria-label={t('eventForm.removeLast')}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              </div>
              <div className="option-editor__grid">
                <SelectField label={t('eventForm.club')} value={entry.clubId} onChange={(e) => setEntry(index, { clubId: e.target.value })} error={errors[`clubs.${index}.clubId`]}>
                  <option value="">{t('eventForm.chooseClub')}</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id} disabled={chosen.includes(String(c.id)) && entry.clubId !== String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </SelectField>
                <ImageUpload label={t('competitionForm.image')} value={entry.imagePath} onChange={(p) => setEntry(index, { imagePath: p })} upload={(file) => adminApi.uploadImage('competitions', file)} disabled={locked} />
              </div>
            </fieldset>
          ))}
          {form.clubs.length < 4 && !locked && (
            <Button onClick={() => setCount(form.clubs.length + 1)}>
              <Plus aria-hidden="true" /> {t('competitionForm.add')}
            </Button>
          )}
        </div>
      </Card>
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
        <Button variant="ghost" to={editing ? `/admin/competitions/${competition.id}` : '/admin/competitions'}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}

export default function AdminCompetitionForm() {
  const { t } = useTranslation();
  const { competitionId } = useParams();
  const editing = Boolean(competitionId);
  useDocumentTitle(editing ? t('competitionForm.editTitle') : t('competitionForm.createTitle'));
  const { data, loading, error, reload } = useApi(async () => {
    const [clubs, competition] = await Promise.all([adminApi.clubs(), editing ? adminApi.competition(competitionId) : null]);
    return { clubs: clubs.filter((c) => c.isActive), competition };
  }, [competitionId]);

  if (loading && !data) return <ListSkeleton rows={3} height={140} />;
  if (error && !data) {
    return (
      <Card>
        <ErrorState error={error} onRetry={reload} />
      </Card>
    );
  }
  if (!data) return null;
  return (
    <>
      <PageHead back={{ to: editing ? `/admin/competitions/${competitionId}` : '/admin/competitions', label: t('common.back') }} title={editing ? t('competitionForm.editTitle') : t('competitionForm.createTitle')} subtitle={t('competitionForm.subtitle')} />
      <CompetitionFormBody key={competitionId ?? 'new'} competition={data.competition} clubs={data.clubs} />
    </>
  );
}

