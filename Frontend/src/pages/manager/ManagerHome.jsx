import { Link } from 'react-router-dom';
import { Briefcase, CalendarCheck, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { managerApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatNumber } from '../../utils/format.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge, LogoImage, PageHead } from '../../components/common/Display.jsx';
import { Alert, EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';

export default function ManagerHome() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useDocumentTitle(t('nav.managerPanel'));
  const { data, loading, error, reload } = useApi(() => managerApi.clubs(), []);
  const clubs = data?.clubs ?? [];

  return (
    <>
      <PageHead title={t('manager.title')} subtitle={t('manager.subtitle')} />
      {loading && !data ? (
        <ListSkeleton rows={2} height={160} />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : clubs.length === 0 ? (
        <Card>
          <EmptyState icon={Briefcase} title={t('manager.noClubsTitle')} text={t('manager.noClubsText')} />
        </Card>
      ) : (
        <>
          <div className="grid grid--auto">
            {clubs.map((club) => (
              <Card key={club.id} className="club-card" interactive>
                <div className="club-card__top">
                  <div className="club-card__logo">
                    <LogoImage path={club.logoPath} name={club.name} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3>{club.name}</h3>
                    <div className="row" style={{ gap: 6, marginTop: 4 }}>
                      {!club.isActive && <Badge variant="warning">{t('clubs.inactive')}</Badge>}
                      <Badge variant={club.canCreateEvents ? 'success' : ''} plain>
                        {club.canCreateEvents ? t('manager.canCreate') : t('manager.viewOnly')}
                      </Badge>
                      {club.canDelegateVote && (
                        <Badge variant="info" plain>
                          {t('manager.canDelegate')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="row" style={{ gap: 18 }}>
                  <span className="muted sm">
                    <Users size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('manager.subscribers', { n: formatNumber(club.subscribers, lang) })}
                  </span>
                  <span className="muted sm">
                    <CalendarCheck size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('manager.openEvents', { n: formatNumber(club.openEvents, lang) })}
                  </span>
                </div>
                <Button variant="primary" to={`/manager/clubs/${club.id}`}>
                  {t('manager.openClub')}
                </Button>
              </Card>
            ))}
          </div>
          <Alert variant="info" className="" role="note">
            {t('manager.privacyNote')} <Link to="/events/clubs">{t('nav.clubEvents')}</Link>
          </Alert>
        </>
      )}
    </>
  );
}
