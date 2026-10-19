import { Link } from 'react-router-dom';
import { CalendarDays, CheckCircle2, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { competitionApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { assetUrl } from '../../utils/env.js';
import { formatDateRange } from '../../utils/format.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge, Countdown, PageHead, StateBadge } from '../../components/common/Display.jsx';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';

export default function Competitions() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useDocumentTitle(t('nav.competition'));
  const { data, loading, error, reload } = useApi(() => competitionApi.list(), []);

  return (
    <>
      <PageHead title={t('competitions.title')} subtitle={t('competitions.subtitle')} />
      {loading && !data ? (
        <ListSkeleton rows={2} height={140} />
      ) : error ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : !data?.length ? (
        <Card>
          <EmptyState icon={Trophy} title={t('competitions.emptyTitle')} text={t('competitions.emptyText')} />
        </Card>
      ) : (
        <div className="event-list">
          {data.map((c) => (
            <article key={c.id} className="card card--interactive event-row" aria-label={c.title}>
              <div className="event-row__icon">
                {assetUrl(c.coverImagePath) ? <img src={assetUrl(c.coverImagePath)} alt="" /> : <Trophy aria-hidden="true" />}
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 className="event-row__title" dir="auto">
                  <span>{c.title}</span>
                  <StateBadge state={c.state} />
                  {c.hasVoted && (
                    <Badge variant="primary" plain>
                      <CheckCircle2 size={13} aria-hidden="true" /> {t('events.voted')}
                    </Badge>
                  )}
                </h3>
                <div className="event-row__meta">
                  <span>
                    <CalendarDays aria-hidden="true" /> {formatDateRange(c.startTime, c.endTime, lang)}
                  </span>
                  {c.state === 'open' && <Countdown to={c.endTime} prefix={t('events.endsIn')} />}
                </div>
                {c.description && <p className="event-row__desc" dir="auto">{c.description}</p>}
                <div className="thumbs" aria-label={t('competitions.contenders')}>
                  {c.clubs.map((club) =>
                    assetUrl(club.imagePath) ? <img key={club.clubId} src={assetUrl(club.imagePath)} alt={club.name} title={club.name} /> : <span key={club.clubId} title={club.name} />
                  )}
                </div>
              </div>
              <div className="event-row__side">
                <Button variant={c.canVote ? 'primary' : 'secondary'} to={`/competitions/${c.id}`}>
                  {c.canVote ? t('events.voteNow') : t('events.view')}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Link to="/results" className="sm bold" style={{ display: 'inline-block', marginTop: 18 }}>
        {t('competitions.seeResults')}
      </Link>
    </>
  );
}
