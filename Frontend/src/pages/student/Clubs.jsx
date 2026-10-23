import { useState } from 'react';
import { Check, Heart, LogOut, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clubApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { errorText } from '../../utils/errors.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge, LogoImage, PageHead } from '../../components/common/Display.jsx';
import { Alert, EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';

export default function Clubs() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const toast = useToast();
  const { refreshUser } = useAuth();
  useDocumentTitle(t('nav.myClubs'));
  const { data, loading, error, reload } = useApi(() => clubApi.list(), []);
  const [pending, setPending] = useState(null);
  const [notice, setNotice] = useState('');

  const clubs = data?.clubs ?? [];
  const count = data?.count ?? 0;
  const limit = data?.limit ?? 2;
  const full = count >= limit;

  const change = async (club, subscribe) => {
    setNotice('');
    if (!subscribe) {
      const ok = await confirm({
        title: t('clubs.leaveTitle', { name: club.name }),
        text: t('clubs.leaveText'),
        confirmLabel: t('clubs.leave'),
        danger: true
      });
      if (!ok) return;
    }
    setPending(club.id);
    try {
      if (subscribe) await clubApi.subscribe(club.id);
      else await clubApi.unsubscribe(club.id);
      toast.success(subscribe ? t('clubs.joined', { name: club.name }) : t('clubs.left', { name: club.name }));
      await Promise.all([reload({ silent: true }), refreshUser()]);
    } catch (err) {
      setNotice(errorText(t, err));
      reload({ silent: true });
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <PageHead title={t('clubs.title')} subtitle={t('clubs.subtitle')} />
      <Card className="club-meter">
        <div className="club-meter__pips" aria-hidden="true">
          {Array.from({ length: limit }, (_, i) => (
            <span key={i} className="club-meter__pip" data-on={i < count} />
          ))}
        </div>
        <div>
          <strong>
            {count}/{limit}
          </strong>{' '}
          <span className="muted">{t('clubs.meterLabel')}</span>
          <div className="muted sm">{full ? t('clubs.limitReached') : t('clubs.slotsLeft', { n: limit - count })}</div>
        </div>
      </Card>
      {notice && (
        <Alert variant="danger" className="" role="alert">
          {notice}
        </Alert>
      )}
      <div style={{ marginTop: notice ? 16 : 0 }}>
        {loading && !data ? (
          <ListSkeleton rows={3} height={150} />
        ) : error ? (
          <Card>
            <ErrorState error={error} onRetry={reload} />
          </Card>
        ) : clubs.length === 0 ? (
          <Card>
            <EmptyState icon={Users} title={t('clubs.emptyTitle')} text={t('clubs.emptyText')} />
          </Card>
        ) : (
          <div className="grid grid--auto">
            {clubs.map((club) => (
              <Card key={club.id} className={`club-card${club.subscribed ? ' club-card--subscribed' : ''}`}>
                <div className="club-card__top">
                  <div className="club-card__logo">
                    <LogoImage path={club.logoPath} name={club.name} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <h3>{club.name}</h3>
                    {club.subscribed && (
                      <Badge variant="primary" plain>
                        <Check size={13} aria-hidden="true" /> {t('clubs.subscribed')}
                      </Badge>
                    )}
                    {!club.isActive && <Badge variant="warning">{t('clubs.inactive')}</Badge>}
                  </div>
                </div>
                <p>{club.description || t('clubs.noDescription')}</p>
                {club.subscribed ? (
                  <Button variant="danger" onClick={() => change(club, false)} loading={pending === club.id}>
                    <LogOut aria-hidden="true" className="flip-rtl" /> {t('clubs.leave')}
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => change(club, true)} loading={pending === club.id} disabled={full || !club.isActive} title={full ? t('clubs.limitReached') : undefined}>
                    <Heart aria-hidden="true" /> {t('clubs.join')}
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
