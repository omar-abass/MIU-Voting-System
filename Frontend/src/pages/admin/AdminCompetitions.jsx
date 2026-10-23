import { Plus, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatDateTime, formatNumber } from '../../utils/format.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge, PageHead, StateBadge } from '../../components/common/Display.jsx';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';

export default function AdminCompetitions() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useDocumentTitle(t('nav.competitions'));
  const { data, loading, error, reload } = useApi(() => adminApi.competitions(), []);

  return (
    <>
      <PageHead
        title={t('admin.competitions.title')}
        subtitle={t('admin.competitions.subtitle')}
        actions={
          <Button variant="primary" to="/admin/competitions/new">
            <Plus aria-hidden="true" /> {t('admin.competitions.create')}
          </Button>
        }
      />
      {loading && !data ? (
        <ListSkeleton rows={3} height={64} />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={Trophy} title={t('admin.competitions.emptyTitle')} text={t('admin.competitions.emptyText')} action={<Button variant="primary" to="/admin/competitions/new">{t('admin.competitions.create')}</Button>} />
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('eventForm.title')}</th>
                <th scope="col">{t('admin.competitions.contenders')}</th>
                <th scope="col">{t('admin.events.start')}</th>
                <th scope="col">{t('admin.events.end')}</th>
                <th scope="col">{t('admin.events.status')}</th>
                <th scope="col">{t('eventManage.votesCast')}</th>
                <th scope="col">
                  <span className="sr-only">{t('common.actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="bold">{c.title}</td>
                  <td>
                    <div className="chip-list">
                      {c.clubs.map((club) => (
                        <Badge key={club.clubId} plain>
                          {club.name}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="sm muted">{formatDateTime(c.startTime, lang)}</td>
                  <td className="sm muted">{formatDateTime(c.endTime, lang)}</td>
                  <td>
                    <StateBadge state={c.state} />
                  </td>
                  <td className="num">{formatNumber(c.votesCast, lang)}</td>
                  <td>
                    <div className="actions">
                      <Button size="sm" to={`/admin/competitions/${c.id}`}>
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
    </>
  );
}

