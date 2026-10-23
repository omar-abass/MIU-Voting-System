import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resultApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatDateTime, formatNumber, formatPercent } from '../../utils/format.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { PageHead, ProgressBar, Tabs } from '../../components/common/Display.jsx';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { SelectField } from '../../components/forms/Fields.jsx';

/** Brings events and competitions into one row shape: { id, name, votes, percentage, isWinner }. */
function normalise(item, kind) {
  if (kind === 'competitions') {
    return {
      key: `c${item.id}`,
      title: item.title,
      subtitle: null,
      totalVotes: item.totalVotes,
      eligibleVoters: null,
      participationRate: null,
      isTie: item.isTie,
      endedAt: item.endTime,
      rows: item.clubs.map((c) => ({ id: c.clubId, name: c.name, votes: c.votes, percentage: c.percentage, isWinner: c.isWinner }))
    };
  }
  return {
    key: `e${item.id}`,
    title: item.title,
    subtitle: item.question,
    club: item.clubName,
    totalVotes: item.totalVotes,
    eligibleVoters: item.eligibleVoters,
    participationRate: item.participationRate,
    isTie: item.isTie,
    endedAt: item.endTime,
    rows: item.options.map((o) => ({ id: o.id, name: o.title, votes: o.votes, percentage: o.percentage, isWinner: o.isWinner }))
  };
}

export default function Results() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useDocumentTitle(t('nav.results'));

  const { data, loading, error, reload } = useApi(async () => {
    const [university, clubs, competitions] = await Promise.all([resultApi.university(), resultApi.clubs(), resultApi.competitions()]);
    return {
      university: university.map((i) => normalise(i, 'university')),
      clubs: clubs.map((i) => normalise(i, 'clubs')),
      competitions: competitions.map((i) => normalise(i, 'competitions'))
    };
  }, []);

  const [tab, setTab] = useState('university');
  const [selectedKey, setSelectedKey] = useState('');
  const list = data?.[tab] ?? [];

  // Open the first tab that has something to show, once data arrives.
  useEffect(() => {
    if (!data) return;
    if (data[tab].length === 0) {
      const firstWithData = ['university', 'clubs', 'competitions'].find((k) => data[k].length > 0);
      if (firstWithData) setTab(firstWithData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  useEffect(() => {
    setSelectedKey(list[0]?.key ?? '');
  }, [tab, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const current = useMemo(() => list.find((i) => i.key === selectedKey) ?? null, [list, selectedKey]);
  const tabs = [
    { value: 'university', label: `${t('results.tabUniversity')} (${formatNumber(data?.university.length ?? 0, lang)})` },
    { value: 'clubs', label: `${t('results.tabClubs')} (${formatNumber(data?.clubs.length ?? 0, lang)})` },
    { value: 'competitions', label: `${t('results.tabCompetitions')} (${formatNumber(data?.competitions.length ?? 0, lang)})` }
  ];

  const winnerNames = current ? current.rows.filter((r) => r.isWinner).map((r) => r.name) : [];

  return (
    <>
      <PageHead title={t('results.title')} subtitle={t('results.subtitle')} />
      {loading && !data ? (
        <ListSkeleton rows={2} height={160} />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : (
        <>
          <div className="results-toolbar">
            <Tabs tabs={tabs} value={tab} onChange={setTab} label={t('results.title')} />
            {list.length > 0 && (
              <SelectField label={t('results.choose')} className="sr-label" value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} style={{ minWidth: 260 }}>
                {list.map((i) => (
                  <option key={i.key} value={i.key}>
                    {i.title}
                  </option>
                ))}
              </SelectField>
            )}
          </div>

          {!current ? (
            <Card>
              <EmptyState
                icon={tab === 'competitions' ? Trophy : BarChart3}
                title={t('results.emptyTitle')}
                text={tab === 'clubs' ? t('results.emptyClubs') : t('results.emptyText')}
                action={
                  tab === 'clubs' ? (
                    <Button variant="soft" to="/clubs">
                      {t('events.browseClubs')}
                    </Button>
                  ) : null
                }
              />
            </Card>
          ) : (
            <Card className="result-card">
              <div className="winner-banner" role="status">
                <Trophy aria-hidden="true" />
                <div>
                  <div className="bold">
                    {current.totalVotes === 0 ? t('results.noVotes') : current.isTie ? t('results.tie', { names: winnerNames.join(' / ') }) : t('results.winner', { name: winnerNames[0] })}
                  </div>
                  <div className="muted sm">{t('results.published', { date: formatDateTime(current.endedAt, lang) })}</div>
                </div>
              </div>
              <div className="card__header">
                <div>
                  <h2 className="card__title">{current.title}</h2>
                  {current.subtitle && <p className="card__subtitle">{current.subtitle}</p>}
                  {current.club && <p className="card__subtitle">{current.club}</p>}
                </div>
                <div className="total-badge">
                  <small>{t('results.totalVotes')}</small>
                  <strong>{formatNumber(current.totalVotes, lang)}</strong>
                  {current.eligibleVoters ? (
                    <small>
                      {t('results.participation', { votes: formatNumber(current.totalVotes, lang), eligible: formatNumber(current.eligibleVoters, lang), rate: formatPercent(current.participationRate, lang) })}
                    </small>
                  ) : null}
                </div>
              </div>
              <div className="table-wrap">
                <table className="table results-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('results.candidate')}</th>
                      <th scope="col">{t('results.votes')}</th>
                      <th scope="col">{t('results.percentage')}</th>
                      <th scope="col" className="bar-cell">
                        <span className="sr-only">{t('results.share')}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.rows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {row.name}
                          {row.isWinner && current.totalVotes > 0 && <Trophy size={14} className="winner-ico" role="img" aria-label={t('results.winnerBadge')} />}
                        </td>
                        <td className="num">{formatNumber(row.votes, lang)}</td>
                        <td className="num">{formatPercent(row.percentage, lang)}</td>
                        <td className="bar-cell">
                          <ProgressBar value={row.percentage} label={`${row.name} ${formatPercent(row.percentage, lang)}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {current.isTie && <p className="muted sm" style={{ marginTop: 12 }}>{t('results.tieNote')}</p>}
              {tab === 'competitions' && (
                <Link to="/competitions" className="sm bold" style={{ display: 'inline-block', marginTop: 12 }}>
                  {t('competitions.title')}
                </Link>
              )}
            </Card>
          )}
        </>
      )}
    </>
  );
}
