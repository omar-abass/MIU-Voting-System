import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminApi, referenceApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { Card } from '../../components/common/Card.jsx';
import { PageHead } from '../../components/common/Display.jsx';
import { ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { EventForm } from '../../components/forms/EventForm.jsx';

export default function AdminEventForm() {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(eventId);
  useDocumentTitle(editing ? t('eventForm.editTitle') : t('eventForm.createTitle'));

  const { data, loading, error, reload } = useApi(async () => {
    const [clubs, faculties, event] = await Promise.all([adminApi.clubs(), referenceApi.faculties(), editing ? adminApi.event(eventId) : null]);
    return { clubs: clubs.filter((c) => c.isActive), faculties, event };
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
  const back = editing ? `/admin/events/${eventId}` : '/admin/events';

  return (
    <>
      <PageHead back={{ to: back, label: t('common.back') }} title={editing ? t('eventForm.editTitle') : t('eventForm.createTitle')} subtitle={t('eventForm.adminSubtitle')} />
      <EventForm
        key={eventId ?? 'new'}
        mode="admin"
        event={data.event}
        clubs={data.clubs}
        faculties={data.faculties}
        api={{ create: (body) => adminApi.createEvent(body), update: (id, body) => adminApi.updateEvent(id, body) }}
        uploadOptionImage={(file) => adminApi.uploadImage('options', file)}
        uploadCoverImage={(file) => adminApi.uploadImage('events', file)}
        cancelTo={back}
        onSaved={(saved) => navigate(`/admin/events/${saved.id}`)}
      />
    </>
  );
}

