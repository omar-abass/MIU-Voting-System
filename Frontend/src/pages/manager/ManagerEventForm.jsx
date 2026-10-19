import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { managerApi, referenceApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { Card } from '../../components/common/Card.jsx';
import { PageHead } from '../../components/common/Display.jsx';
import { Alert, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { EventForm } from '../../components/forms/EventForm.jsx';

export default function ManagerEventForm() {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const editing = Boolean(eventId);
  useDocumentTitle(editing ? t('eventForm.editTitle') : t('eventForm.createTitle'));

  const { data, loading, error, reload } = useApi(async () => {
    const [clubs, faculties, event] = await Promise.all([managerApi.clubs(), referenceApi.faculties(), editing ? managerApi.event(eventId) : null]);
    return { clubs: clubs.clubs.filter((c) => c.canCreateEvents && c.isActive), faculties, event };
  }, [eventId]);

  if (loading && !data) return <ListSkeleton rows={3} height={140} />;
  if (error && !data) {
    return (
      <Card>
        <ErrorState error={error} onRetry={reload} />
      </Card>
    );
  }
  if (!data) return null;

  if (!editing && data.clubs.length === 0) {
    return (
      <>
        <PageHead back={{ to: '/manager', label: t('manager.back') }} title={t('eventForm.createTitle')} />
        <Alert variant="warning">{t('manager.noCreatePermission')}</Alert>
      </>
    );
  }

  // Pre-select the club chosen on the previous screen.
  const preselect = Number(params.get('club'));
  const clubs = !editing && preselect ? data.clubs.slice().sort((a, b) => (a.id === preselect ? -1 : b.id === preselect ? 1 : 0)) : data.clubs;
  const back = editing ? `/manager/events/${eventId}` : '/manager';

  return (
    <>
      <PageHead back={{ to: back, label: t('common.back') }} title={editing ? t('eventForm.editTitle') : t('eventForm.createTitle')} subtitle={t('eventForm.managerSubtitle')} />
      <EventForm
        key={eventId ?? 'new'}
        mode="manager"
        event={data.event}
        clubs={!editing && preselect ? clubs.filter((c) => c.id === preselect) : clubs}
        faculties={data.faculties}
        api={{ create: (body) => managerApi.createEvent(body), update: (id, body) => managerApi.updateEvent(id, body) }}
        uploadOptionImage={(file) => managerApi.uploadImage(file)}
        cancelTo={back}
        onSaved={(saved) => navigate(`/manager/events/${saved.id}`)}
      />
    </>
  );
}
