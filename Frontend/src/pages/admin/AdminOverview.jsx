import { Link } from 'react-router-dom';
import { Activity, CalendarCheck, Layers, UserCheck, Users, Vote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatDateTime } from '../../utils/format.js';
import { facultyName } from '../../utils/names.js';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { PageHead, StatCard } from '../../components/common/Display.jsx';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { DonutChart, HBarChart } from '../../components/charts/Charts.jsx';

export default function AdminOverview() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useDocumentTitle(t('nav.overview'));
  const { data, loading, error, reload } = useApi(() => adminApi.dashboard(), []);

  if (loading && !data) return <ListSkeleton rows={4} height={120} />;
  if (error && !data) {
    return (
      <Card>
        <ErrorState error={error} onRetry={reload} />
      </Card>
    );
  }
  if (!data) return null;
  const { totals } = data;
  const activeTotal = totals.activeUniversityEvents + totals.activeClubEvents + totals.activeCompetitions;

  return (
    <>
      <PageHead title={t('admin.overview.title')} subtitle={t('admin.overview.subtitle')} />
      <div className="grid grid--4">
        <StatCard icon={Users} label={t('admin.overview.totalUsers')} value={totals.totalUsers} note={t('admin.overview.verifiedNote', { n: totals.verifiedUsers })} />
        <StatCard icon={UserCheck} label={t('admin.overview.eligibleVoters')} value={totals.eligibleVoters} />
        <StatCard icon={Layers} label={t('admin.overview.activeClubs')} value={totals.activeClubs} note={t('admin.overview.subscriptionsNote', { n: totals.clubSubscriptions })} />
        <StatCard icon={Activity} label={t('admin.overview.activeNow')} value={activeTotal} />
      </div>

      <div className="charts-row" style={{ marginTop: 18 }}>
        <Card>
          <HBarChart
            title={t('admin.overview.participation')}
            subtitle={t('admin.overview.participationHint')}
            valueLabel={t('admin.overview.rate')}
            format={(v) => `${v}%`}
            domainMax={100}
            data={data.participation.map((p) => ({ key: p.eventId, name: p.title, value: p.rate, note: `${p.votesCast} / ${p.eligibleVoters}` }))}
          />
          {data.participation.length === 0 && <EmptyState icon={Vote} title={t('admin.overview.noEvents')} />}
        </Card>
        <Card>
          <DonutChart
            title={t('admin.overview.activeByType')}
            valueLabel={t('admin.overview.activeNow')}
            totalLabel={t('admin.overview.activeNow')}
            data={[
              { key: 'u', name: t('admin.overview.universityEvents'), value: totals.activeUniversityEvents },
              { key: 'c', name: t('admin.overview.clubEvents'), value: totals.activeClubEvents },
              { key: 'p', name: t('admin.overview.competitions'), value: totals.activeCompetitions }
            ]}
          />
        </Card>
      </div>

      <div className="grid grid--2" style={{ marginTop: 18 }}>
        <Card>
          <HBarChart
            title={t('admin.overview.byFaculty')}
            valueLabel={t('admin.overview.users')}
            data={data.usersByFaculty.map((f) => ({ key: f.id, name: facultyName(f, lang), value: f.users }))}
            labelMax={26}
          />
        </Card>
        <Card>
          <HBarChart
            title={t('admin.overview.bySubscribers')}
            valueLabel={t('admin.overview.subscribers')}
            data={data.clubSubscribers.map((c) => ({ key: c.id, name: c.name, value: c.subscribers }))}
          />
        </Card>
      </div>

      <Card style={{ marginTop: 18 }}>
        <CardHeader title={t('admin.overview.recent')} actions={<Link to="/admin/audit" className="sm bold">{t('admin.overview.viewAudit')}</Link>} />
        {data.recentActivity.length === 0 ? (
          <p className="muted">{t('admin.overview.noActivity')}</p>
        ) : (
          <ul className="activity list-reset" role="list">
            {data.recentActivity.map((a) => (
              <li key={a.id}>
                <CalendarCheck aria-hidden="true" />
                <div>
                  <span className="bold">{t(`audit.actions.${a.action}`, { defaultValue: a.action })}</span>
                  <span className="muted"> · {a.actorUsername ?? t('audit.system')}</span>
                  <time dateTime={a.createdAt}>{formatDateTime(a.createdAt, lang)}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

