import { useParams } from 'react-router-dom';
import { CalendarPlus, Users, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { managerApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatDateTime, formatNumber, formatPercent } from '../../utils/format.js';
import { Button } from '../../components/common/Button.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { PageHead, StateBadge, StatCard } from '../../components/common/Display.jsx';
import { Alert, EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';

export default function ManagerClub() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { clubId } = useParams();
  const { data, loading, error, reload } = useApi(() => managerApi.clubStats(clubId), [clubId]);
  useDocumentTitle(data?.club?.name);

  if (loading && !data) return <ListSkeleton rows={3} height={110} />;
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
      <PageHead
        back={{ to: '/manager', label: t('manager.back') }}
        title={data.club.name}
        subtitle={data.club.description}
        actions={
          data.permissions.canCreateEvents ? (
            <Button variant="primary" to={`/manager/events/new?club=${data.club.id}`}>
              <CalendarPlus aria-hidden="true" /> {t('manager.createEvent')}
            </Button>
          ) : null
        }
      />
      {!data.permissions.canCreateEvents && <Alert variant="info">{t('manager.noCreatePermission')}</Alert>}
      <div className="grid grid--2" style={{ margin: '18px 0' }}>
        <StatCard icon={Users} label={t('manager.subscribersLabel')} value={data.subscribers} />
        <StatCard icon={UserCheck} label={t('manager.eligibleLabel')} value={data.eligibleVoters} note={t('manager.eligibleNote')} />
      </div>
      <Card>
        <CardHeader title={t('manager.events')} />
        {data.events.length === 0 ? (
          <EmptyState icon={CalendarPlus} title={t('manager.noEventsTitle')} text={t('manager.noEventsText')} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t('eventForm.title')}</th>
                  <th scope="col">{t('admin.events.status')}</th>
                  <th scope="col">{t('eventManage.schedule')}</th>
                  <th scope="col">{t('eventManage.votesCast')}</th>
                  <th scope="col">{t('eventManage.participation')}</th>
                  <th scope="col">
                    <span className="sr-only">{t('common.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((e) => (
                  <tr key={e.id}>
                    <td className="bold">{e.title}</td>
                    <td>
                      <StateBadge state={e.state} />
                    </td>
                    <td className="sm muted">
                      {formatDateTime(e.startTime, lang)}
                      <br />
                      {formatDateTime(e.endTime, lang)}
                    </td>
                    <td className="num">
                      {formatNumber(e.votesCast, lang)} / {formatNumber(e.eligibleVoters, lang)}
                    </td>
                    <td className="num">{formatPercent(e.participationRate, lang)}</td>
                    <td>
                      <div className="actions">
                        <Button size="sm" to={`/manager/events/${e.id}`}>
                          {t('common.open')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
