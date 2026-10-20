import { useTranslation } from 'react-i18next';
import { adminApi } from '../../services/endpoints.js';
import EventManage from '../shared/EventManage.jsx';

const api = {
  get: (id) => adminApi.event(id),
  action: (id, action) => adminApi.eventAction(id, action),
  remove: (id) => adminApi.deleteEvent(id)
};

export default function AdminEvent() {
  const { t } = useTranslation();
  return <EventManage mode="admin" api={api} basePath="/admin/events" backTo="/admin/events" backLabel={t('admin.events.back')} />;
}
