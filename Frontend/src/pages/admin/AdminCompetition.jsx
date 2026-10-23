import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ban, CalendarDays, Eye, EyeOff, Pencil, Play, Square, Trash2, Trophy, Users, UserCheck, Vote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { errorText } from '../../utils/errors.js';
import { formatDateRange, formatDateTime, formatPercent } from '../../utils/format.js';
import { Button } from '../../components/common/Button.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Badge, Countdown, LogoImage, PageHead, StateBadge, StatCard } from '../../components/common/Display.jsx';
import { Alert, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { HBarChart } from '../../components/charts/Charts.jsx';

/** Admin view of one club competition: tally, details and lifecycle actions (the API enforces the state machine). */
export default function AdminCompetition() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { competitionId } = useParams();
  const { data: comp, loading, error, reload, setData } = useApi(() => adminApi.competition(competitionId), [competitionId]);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  useDocumentTitle(comp?.title);

  if (loading && !comp) return <ListSkeleton rows={3} height={110} />;
  if (error && !comp) {
    return (
      <Card>
        <ErrorState error={error} onRetry={reload} />
      </Card>
    );
  }
  if (!comp) return null;

  const run = async (action, { title, text, danger = false, confirmLabel } = {}) => {
    if (title) {
      const ok = await confirm({ title, text, danger, confirmLabel });
      if (!ok) return;
    }
    setBusy(action);
    setNotice('');
    try {
      setData(await adminApi.competitionAction(comp.id, action));
      toast.success(t(`admin.competitions.done.${action}`));
    } catch (err) {
      setNotice(errorText(t, err));
      reload({ silent: true });
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    const ok = await confirm({ title: t('admin.competitions.deleteTitle'), text: t('admin.competitions.deleteText'), danger: true, confirmLabel: t('common.delete') });
    if (!ok) return;
    setBusy('delete');
    try {
      await adminApi.deleteCompetition(comp.id);
      toast.success(t('admin.competitions.done.delete'));
      navigate('/admin/competitions', { replace: true });
    } catch (err) {
      setNotice(errorText(t, err));
    } finally {
      setBusy('');
    }
  };

  const isDraft = comp.status === 'draft';
  const isPublished = comp.status === 'published';
  const isClosed = comp.status === 'closed';
  const isResultsPublished = comp.status === 'results_published';
  const editable = isDraft || (isPublished && comp.state !== 'closed');
  const clubs = comp.clubs ?? [];
  const hasTally = clubs.some((c) => typeof c.votes === 'number');
  const winners = clubs.filter((c) => c.isWinner);

  const rows = [
    [t('eventManage.schedule'), formatDateRange(comp.startTime, comp.endTime, lang)],
    [t('eventManage.resultsPolicy'), comp.resultsPolicy === 'auto_on_close' ? t('eventForm.policyAuto') : t('eventForm.policyManual')],
    [t('admin.competitions.liveResults'), comp.liveResults ? t('common.yes') : t('common.no')],
    [t('eventManage.closedAt'), comp.closedAt ? formatDateTime(comp.closedAt, lang) : '–'],
    [t('eventManage.resultsAt'), comp.resultsPublishedAt ? formatDateTime(comp.resultsPublishedAt, lang) : '–']
  ];

  return (
    <>
      <PageHead
        back={{ to: '/admin/competitions', label: t('admin.competitions.back') }}
        title={
          <span className="row" style={{ gap: 10 }}>
            {comp.title} <StateBadge state={comp.state} />
          </span>
        }
        subtitle={comp.description}
        actions={
          <>
            {editable && (
              <Button to={`/admin/competitions/${comp.id}/edit`}>
                <Pencil aria-hidden="true" /> {t('common.edit')}
              </Button>
            )}
            {isDraft && (
              <Button variant="primary" loading={busy === 'publish'} onClick={() => run('publish', { title: t('admin.competitions.publishTitle'), text: t('admin.competitions.publishText'), confirmLabel: t('eventManage.publish') })}>
                <Play aria-hidden="true" /> {t('eventManage.publish')}
              </Button>
            )}
            {isPublished && (
              <Button loading={busy === 'close'} onClick={() => run('close', { title: t('admin.competitions.closeTitle'), text: t('admin.competitions.closeText'), confirmLabel: t('eventManage.close'), danger: true })}>
                <Square aria-hidden="true" /> {t('eventManage.close')}
              </Button>
            )}
            {(isDraft || isPublished) && (
              <Button variant="danger" loading={busy === 'cancel'} onClick={() => run('cancel', { title: t('admin.competitions.cancelTitle'), text: t('admin.competitions.cancelText'), danger: true, confirmLabel: t('admin.competitions.cancel') })}>
                <Ban aria-hidden="true" /> {t('admin.competitions.cancel')}
              </Button>
            )}
            {isClosed && (
              <Button variant="primary" loading={busy === 'publish-results'} onClick={() => run('publish-results', { title: t('eventManage.publishResultsTitle'), text: t('eventManage.publishResultsText'), confirmLabel: t('eventManage.publishResults') })}>
                <Eye aria-hidden="true" /> {t('eventManage.publishResults')}
              </Button>
            )}
            {isResultsPublished && (
              <Button loading={busy === 'withhold-results'} onClick={() => run('withhold-results', { title: t('eventManage.withholdTitle'), text: t('eventManage.withholdText'), confirmLabel: t('eventManage.withhold'), danger: true })}>
                <EyeOff aria-hidden="true" /> {t('eventManage.withhold')}
              </Button>
            )}
            {isDraft && (
              <Button variant="ghost" loading={busy === 'delete'} onClick={remove}>
                <Trash2 aria-hidden="true" /> {t('common.delete')}
              </Button>
            )}
          </>
        }
      />
      {notice && (
        <div style={{ marginBottom: 16 }}>
          <Alert variant="danger">{notice}</Alert>
        </div>
      )}
      {isPublished && comp.state === 'open' && (
        <div style={{ marginBottom: 14 }}>
          <Countdown to={comp.endTime} prefix={t('events.endsIn')} />
        </div>
      )}

      <div className="grid grid--3" style={{ margin: '18px 0' }}>
        <StatCard icon={Vote} label={t('eventManage.votesCast')} value={comp.votesCast} />
        <StatCard icon={Users} label={t('eventManage.eligible')} value={comp.eligibleVoters} />
        <StatCard icon={UserCheck} label={t('eventManage.participation')} value={formatPercent(comp.participationRate, lang)} />
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
          <h3 className="h4" style={{ margin: '18px 0 10px' }}>
            {t('admin.competitions.contenders')}
          </h3>
          <ol className="list-reset" role="list" style={{ display: 'grid', gap: 10 }}>
            {clubs.map((c) => (
              <li key={c.clubId} className="option-card option-card--static">
                <div className="option-card__media">
                  <LogoImage path={c.imagePath || c.logoPath} name={c.name} />
                </div>
                <div className="option-card__body">
                  <div className="option-card__title">
                    {c.name} {isResultsPublished && c.isWinner && <Trophy size={15} aria-label={t('results.winnerBadge')} style={{ verticalAlign: '-2px' }} />}
                  </div>
                  {c.description && <div className="option-card__desc">{c.description}</div>}
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          {hasTally ? (
            <>
              <HBarChart
                title={isClosed || isResultsPublished ? t('eventManage.finalTally') : t('eventManage.liveTally')}
                subtitle={!isResultsPublished ? t('eventManage.adminOnlyNote') : undefined}
                valueLabel={t('results.votes')}
                data={clubs.map((c) => ({ key: c.clubId, name: c.name, value: c.votes, note: formatPercent(c.percentage, lang) }))}
                colorByIndex
              />
              {comp.isTie && winners.length > 1 && <p className="muted sm" style={{ marginTop: 8 }}>{t('results.tieNote')}</p>}
            </>
          ) : (
            <p className="muted sm">{t('eventManage.hiddenUntilClose')}</p>
          )}
        </Card>
      </div>

      <p className="faint sm" style={{ marginTop: 16 }}>
        <CalendarDays size={13} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('eventManage.createdAt', { date: formatDateTime(comp.createdAt, lang) })}
        {comp.status === 'cancelled' && (
          <>
            {' '}
            <Badge variant="danger">{t('states.cancelled')}</Badge>
          </>
        )}
      </p>
    </>
  );
}

