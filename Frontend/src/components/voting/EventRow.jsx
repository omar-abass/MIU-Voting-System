import { CalendarDays, CheckCircle2, Lock, Users, Vote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { assetUrl } from '../../utils/env.js';
import { formatDateRange } from '../../utils/format.js';
import { Button } from '../common/Button.jsx';
import { Badge, Countdown, StateBadge } from '../common/Display.jsx';

/** One election/event card. Locked club events (not subscribed) only reveal title, club and time. */
export function EventRow({ event, to, results = false }) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const cover = assetUrl(event.coverImagePath ?? event.clubLogoPath);
  const locked = event.locked;
  const isOpen = event.state === 'open';

  return (
    <article className={`card card--interactive event-row${locked ? ' event-row--locked' : ''}`} aria-label={event.title}>
      <div className="event-row__icon">
        {locked ? <Lock aria-hidden="true" /> : cover ? <img src={cover} alt="" /> : event.eventType === 'club' ? <Users aria-hidden="true" /> : <Vote aria-hidden="true" />}
      </div>
      <div style={{ minWidth: 0 }}>
        <h3 className="event-row__title" dir="auto">
          <span>{event.title}</span>
          <StateBadge state={event.state} />
          {event.hasVoted && (
            <Badge variant="primary" plain>
              <CheckCircle2 size={13} aria-hidden="true" /> {t('events.voted')}
            </Badge>
          )}
        </h3>
        <div className="event-row__meta">
          <span>
            <CalendarDays aria-hidden="true" /> {formatDateRange(event.startTime, event.endTime, lang)}
          </span>
          {event.clubName && (
            <span>
              <Users aria-hidden="true" /> {event.clubName}
            </span>
          )}
          {isOpen && <Countdown to={event.endTime} prefix={t('events.endsIn')} />}
        </div>
        {!locked && event.description && <p className="event-row__desc" dir="auto">{event.description}</p>}
        {locked && <p className="event-row__desc" dir="auto">{t('events.lockedText')}</p>}
      </div>
      <div className="event-row__side">
        {locked ? (
          <Button variant="soft" to="/clubs">
            {t('events.subscribeToUnlock')}
          </Button>
        ) : (
          <Button variant={event.canVote ? 'primary' : 'secondary'} to={to ?? `/events/${event.id}`}>
            {event.canVote ? t('events.voteNow') : results ? t('events.viewResults') : t('events.view')}
          </Button>
        )}
      </div>
    </article>
  );
}
