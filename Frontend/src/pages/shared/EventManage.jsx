import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ban, CalendarDays, Eye, EyeOff, Lock, Pencil, Play, Square, Trash2, Users, UserCheck, Vote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { errorText } from '../../utils/errors.js';
import { formatDateRange, formatDateTime, formatNumber, formatPercent } from '../../utils/format.js';
import { Button } from '../../components/common/Button.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Badge, Countdown, PageHead, StateBadge, StatCard } from '../../components/common/Display.jsx';
import { Alert, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { HBarChart } from '../../components/charts/Charts.jsx';

/**
 * Event overview + lifecycle actions, shared by the Admin console and the Club Manager panel.
 * The API decides what is allowed; the buttons here only mirror the state machine for convenience.
 */
export default function EventManage({ mode, api, basePath, backTo, backLabel, canWrite = true, extra }) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const toast = useToast();
  const confirm = useConfirm();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { data: ev, loading, error, reload, setData } = useApi(() => api.get(eventId), [eventId]);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  useDocumentTitle(ev?.title);

  if (loading && !ev) return <ListSkeleton rows={3} height={110} />;
  if (error && !ev) {
    return (
      <Card>
        <ErrorState error={error} onRetry={reload} />
      </Card>
    );
  }
  if (!ev) return null;

  const run = async (action, { title, text, danger = false, confirmLabel } = {}) => {
    if (title) {
      const ok = await confirm({ title, text, danger, confirmLabel });
      if (!ok) return;
    }
    setBusy(action);
    setNotice('');
    try {
      setData(await api.action(ev.id, action));
      toast.success(t(`eventManage.done.${action}`));
    } catch (err) {
      setNotice(errorText(t, err));
      reload({ silent: true });
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    const ok = await confirm({ title: t('eventManage.deleteTitle'), text: t('eventManage.deleteText'), danger: true, confirmLabel: t('common.delete') });
    if (!ok) return;
    setBusy('delete');
    try {
      await api.remove(ev.id);
      toast.success(t('eventManage.done.delete'));
      navigate(backTo, { replace: true });
    } catch (err) {
      setNotice(errorText(t, err));
    } finally {
      setBusy('');
    }
  };

  const writable = typeof canWrite === 'function' ? canWrite(ev) : canWrite;
  const isDraft = ev.status === 'draft';
  const isPublished = ev.status === 'published';
  const isClosed = ev.status === 'closed';
  const isResultsPublished = ev.status === 'results_published';
  const editable = writable && (isDraft || (isPublished && ev.state !== 'closed'));
  const resultsVisible = mode === 'admin' || ev.resultsVisible;
  const options = ev.options ?? [];
  const hasTally = options.some((o) => typeof o.votes === 'number');

  const actions = writable ? (
    <>
      {editable && (
        <Button to={`${basePath}/${ev.id}/edit`}>
          <Pencil aria-hidden="true" /> {t('common.edit')}
        </Button>
      )}
      {isDraft && (
        <Button variant="primary" loading={busy === 'publish'} onClick={() => run('publish', { title: t('eventManage.publishTitle'), text: t('eventManage.publishText'), confirmLabel: t('eventManage.publish') })}>
          <Play aria-hidden="true" /> {t('eventManage.publish')}
        </Button>
      )}
      {isPublished && (
        <Button loading={busy === 'close'} onClick={() => run('close', { title: t('eventManage.closeTitle'), text: t('eventManage.closeText'), confirmLabel: t('eventManage.close'), danger: true })}>
          <Square aria-hidden="true" /> {t('eventManage.close')}
        </Button>
      )}
      {(isDraft || isPublished) && (
        <Button variant="danger" loading={busy === 'cancel'} onClick={() => run('cancel', { title: t('eventManage.cancelTitle'), text: t('eventManage.cancelText'), danger: true, confirmLabel: t('eventManage.cancel') })}>
          <Ban aria-hidden="true" /> {t('eventManage.cancel')}
        </Button>
      )}
      {mode === 'admin' && isClosed && (
        <Button variant="primary" loading={busy === 'publish-results'} onClick={() => run('publish-results', { title: t('eventManage.publishResultsTitle'), text: t('eventManage.publishResultsText'), confirmLabel: t('eventManage.publishResults') })}>
          <Eye aria-hidden="true" /> {t('eventManage.publishResults')}
        </Button>
      )}
      {mode === 'admin' && isResultsPublished && (
        <Button loading={busy === 'withhold-results'} onClick={() => run('withhold-results', { title: t('eventManage.withholdTitle'), text: t('eventManage.withholdText'), confirmLabel: t('eventManage.withhold'), danger: true })}>
          <EyeOff aria-hidden="true" /> {t('eventManage.withhold')}
        </Button>
      )}
      {mode === 'admin' && isDraft && (
        <Button variant="ghost" loading={busy === 'delete'} onClick={remove}>
          <Trash2 aria-hidden="true" /> {t('common.delete')}
        </Button>
      )}
    </>
  ) : null;

  const rows = [
    [t('eventManage.type'), ev.eventType === 'club' ? `${t('eventForm.typeClub')} - ${ev.clubName ?? ''}` : t('eventForm.typeUniversity')],
    [t('eventManage.schedule'), formatDateRange(ev.startTime, ev.endTime, lang)],
    [t('eventManage.resultsPolicy'), ev.resultsPolicy === 'auto_on_close' ? t('eventForm.policyAuto') : t('eventForm.policyManual')],
    [t('eventManage.delegated'), ev.allowDelegatedVoting ? t('common.yes') : t('common.no')],
    [t('eventManage.closedAt'), ev.closedAt ? formatDateTime(ev.closedAt, lang) : '–'],
    [t('eventManage.resultsAt'), ev.resultsPublishedAt ? formatDateTime(ev.resultsPublishedAt, lang) : '–']
  ];

  return (
    <>
      <PageHead
        back={{ to: backTo, label: backLabel }}
        title={
          <span className="row" style={{ gap: 10 }}>
            {ev.title} <StateBadge state={ev.state} />
          </span>
        }
        subtitle={ev.question}
        actions={actions}
      />
      {notice && (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="danger">{notice}</Alert>
        </div>
      )}
      {isPublished && ev.state === 'open' && (
        <div style={{ marginBottom: 14 }}>
          <Countdown to={ev.endTime} prefix={t('events.endsIn')} />
        </div>
      )}
      {mode === 'manager' && !writable && <Alert variant="info">{t('eventManage.readOnlyManager')}</Alert>}

      <div className="grid grid--3" style={{ margin: '18px 0' }}>
        <StatCard icon={Vote} label={t('eventManage.votesCast')} value={ev.votesCast} />
        <StatCard icon={Users} label={t('eventManage.eligible')} value={ev.eligibleVoters} />
        <StatCard icon={UserCheck} label={t('eventManage.participation')} value={formatPercent(ev.participationRate, lang)} />
      </div>

      <div className="grid grid--2">
        <Card>
          <CardHeader title={t('eventManage.details')} />
          {rows.map(([k, v]) => (
            <div className="kv" key={k}>
              <span>{k}</span>
              <span>{v}</span>
            </div>
          ))}
          {ev.description && <p className="muted sm" dir="auto" style={{ marginTop: 12 }}>{ev.description}</p>}
        </Card>
        <Card>
          {resultsVisible && hasTally ? (
            <>
              <HBarChart
                title={isClosed || isResultsPublished ? t('eventManage.finalTally') : t('eventManage.liveTally')}
                subtitle={mode === 'admin' && !isResultsPublished ? t('eventManage.adminOnlyNote') : undefined}
                valueLabel={t('results.votes')}
                data={options.map((o) => ({ key: o.id, name: o.title, value: o.votes, note: formatPercent(o.percentage, lang) }))}
                colorByIndex
              />
              {ev.isTie && <p className="muted sm" style={{ marginTop: 8 }}>{t('results.tieNote')}</p>}
            </>
          ) : (
            <>
              <CardHeader title={t('eventForm.options')} />
              <ol className="list-reset" role="list" style={{ display: 'grid', gap: 10 }}>
                {options.map((o) => (
                  <li key={o.id} className="option-card option-card--static">
                    <div className="option-card__body">
                      <div className="option-card__title" dir="auto">{o.title}</div>
                      {o.description && <div className="option-card__desc" dir="auto">{o.description}</div>}
                    </div>
                  </li>
                ))}
              </ol>
              <p className="muted sm" style={{ marginTop: 12 }}>
                <Lock size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('eventManage.hiddenUntilClose')}
              </p>
            </>
          )}
        </Card>
      </div>

      {extra?.(ev, () => reload({ silent: true }))}

      <p className="faint sm" style={{ marginTop: 16 }}>
        <CalendarDays size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('eventManage.createdAt', { date: formatDateTime(ev.createdAt, lang) })}
        {ev.status === 'cancelled' && (
          <>
            {' '}
            <Badge variant="danger">{t('states.cancelled')}</Badge>
          </>
        )}
      </p>
    </>
  );
}

