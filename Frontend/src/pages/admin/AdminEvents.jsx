import { useEffect, useState } from 'react';
import { CalendarCheck, Plus, Search } from 'lucide-react';
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

export default function AdminEvents() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useDocumentTitle(t('nav.events'));
  const [filters, setFilters] = useState({ type: '', status: '', search: '' });
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(filters.search.trim()), 300);
    return () => clearTimeout(id);
  }, [filters.search]);

  const { data, loading, error, reload } = useApi(() => adminApi.events({ type: filters.type, status: filters.status, search: debounced }), [filters.type, filters.status, debounced]);

  return (
    <>
      <PageHead
        title={t('admin.events.title')}
        subtitle={t('admin.events.subtitle')}
        actions={
          <Button variant="primary" to="/admin/events/new">
            <Plus aria-hidden="true" /> {t('admin.events.create')}
          </Button>
        }
      />
      <div className="toolbar">
        <div className="input-icon">
          <Search aria-hidden="true" />
          <input className="input" type="search" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder={t('events.searchPlaceholder')} aria-label={t('events.searchPlaceholder')} />
        </div>
        <select className="select" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} aria-label={t('eventManage.type')}>
          <option value="">{t('admin.events.allTypes')}</option>
          <option value="university">{t('eventForm.typeUniversity')}</option>
          <option value="club">{t('eventForm.typeClub')}</option>
        </select>
        <select className="select" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} aria-label={t('admin.events.status')}>
          <option value="">{t('admin.users.allStatuses')}</option>
          {['draft', 'published', 'closed', 'results_published', 'cancelled'].map((s) => (
            <option key={s} value={s}>
              {t(`states.${s}`)}
            </option>
          ))}
        </select>
      </div>
      {loading && !data ? (
        <ListSkeleton rows={5} height={56} />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : data.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarCheck} title={t('admin.events.emptyTitle')} text={t('admin.events.emptyText')} action={<Button variant="primary" to="/admin/events/new">{t('admin.events.create')}</Button>} />
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">{t('eventForm.title')}</th>
                <th scope="col">{t('eventManage.type')}</th>
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
              {data.map((e) => (
                <tr key={e.id}>
                  <td className="bold">{e.title}</td>
                  <td>
                    <Badge variant={e.eventType === 'club' ? 'info' : 'primary'} plain>
                      {e.eventType === 'club' ? e.clubName ?? t('eventForm.typeClub') : t('eventForm.typeUniversity')}
                    </Badge>
                  </td>
                  <td className="sm muted">{formatDateTime(e.startTime, lang)}</td>
                  <td className="sm muted">{formatDateTime(e.endTime, lang)}</td>
                  <td>
                    <StateBadge state={e.state} />
                  </td>
                  <td className="num">{formatNumber(e.votesCast, lang)}</td>
                  <td>
                    <div className="actions">
                      <Button size="sm" to={`/admin/events/${e.id}`}>
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

