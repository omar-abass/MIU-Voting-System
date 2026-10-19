import { useEffect, useState } from 'react';
import { Search, Users, Vote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { eventApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { Button } from '../../components/common/Button.jsx';
import { Alert, EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { PageHead, Tabs } from '../../components/common/Display.jsx';
import { Card } from '../../components/common/Card.jsx';
import { EventRow } from '../../components/voting/EventRow.jsx';

/** Shared list page: `kind` is 'university' or 'clubs'. */
export default function EventsList({ kind }) {
  const { t } = useTranslation();
  const isClub = kind === 'clubs';
  useDocumentTitle(isClub ? t('nav.clubEvents') : t('nav.universityEvents'));

  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data, loading, error, reload } = useApi(
    () => (isClub ? eventApi.clubs({ status, search: debounced }) : eventApi.university({ status, search: debounced })),
    [kind, status, debounced]
  );

  const events = data?.events ?? [];
  const noSubscriptions = isClub && data && data.subscriptionCount === 0;
  const tabs = [
    { value: 'all', label: t('events.filter.all') },
    { value: 'active', label: t('events.filter.active') },
    { value: 'upcoming', label: t('events.filter.upcoming') },
    { value: 'completed', label: t('events.filter.completed') }
  ];

  return (
    <>
      <PageHead title={isClub ? t('events.clubTitle') : t('events.universityTitle')} subtitle={isClub ? t('events.clubSubtitle') : t('events.universitySubtitle')} />
      {noSubscriptions && (
        <Alert variant="info" title={t('events.noSubscriptionsTitle')} actions={<Button size="sm" variant="primary" to="/clubs">{t('events.browseClubs')}</Button>}>
          {t('events.noSubscriptionsText')}
        </Alert>
      )}
      <div className="filters" style={{ marginTop: noSubscriptions ? 16 : 0 }}>
        <div className="input-icon">
          <Search aria-hidden="true" />
          <input className="input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('events.searchPlaceholder')} aria-label={t('events.searchPlaceholder')} />
        </div>
        <Tabs tabs={tabs} value={status} onChange={setStatus} label={t('events.filter.label')} />
      </div>
      {loading && !data ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <EmptyState icon={isClub ? Users : Vote} title={t('events.emptyTitle')} text={debounced || status !== 'all' ? t('events.emptyFiltered') : t('events.emptyText')} />
        </Card>
      ) : (
        <div className="event-list" aria-busy={loading}>
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      )}
    </>
  );
}
