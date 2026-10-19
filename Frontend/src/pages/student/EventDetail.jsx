import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Clock, Lock, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { eventApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { errorDetails } from '../../utils/errors.js';
import { assetUrl } from '../../utils/env.js';
import { formatDateRange, formatDateTime, initials } from '../../utils/format.js';
import { Alert, EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Countdown, StateBadge } from '../../components/common/Display.jsx';
import { VoteReceipt } from '../../components/voting/VoteReceipt.jsx';
import { VoteSubmission } from '../../components/voting/VoteSubmission.jsx';

function OptionMedia({ option }) {
  const src = assetUrl(option.imagePath);
  return <div className="option-card__media">{src ? <img src={src} alt="" /> : initials(option.title)}</div>;
}

export default function EventDetail() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { eventId } = useParams();
  const { data: event, loading, error, rawError, reload } = useApi(() => eventApi.get(eventId), [eventId]);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState(null);
  useDocumentTitle(event?.title);

  if (loading && !event) return <ListSkeleton rows={3} height={120} />;

  if (rawError) {
    const details = errorDetails(rawError);
    if (rawError.code === 'club_subscription_required') {
      return (
        <Card>
          <EmptyState
            icon={Lock}
            title={t('events.lockedTitle', { club: details?.clubName ?? '' })}
            text={t('events.lockedDetail')}
            action={
              <Button variant="primary" to="/clubs">
                {t('events.subscribeToUnlock')}
              </Button>
            }
          />
        </Card>
      );
    }
    return (
      <>
        <Link to="/events/university" className="back-link">
          {t('events.backToEvents')}
        </Link>
        <Card>
          <ErrorState error={error} onRetry={rawError.code === 'event_not_found' ? undefined : reload} />
        </Card>
      </>
    );
  }
  if (!event) return null;

  const backTo = event.eventType === 'club' ? '/events/clubs' : '/events/university';
  const showReceipt = receipt ?? (event.hasVoted ? { receiptCode: event.receiptCode, votedAt: event.votedAt, already: true } : null);
  const chosen = event.options.find((o) => o.id === selected);

  if (showReceipt && !showReceipt.already) {
    return (
      <VoteReceipt
        title={event.title}
        receiptCode={showReceipt.receiptCode}
        votedAt={event.votedAt ?? showReceipt.votedAt}
        backTo={backTo}
        backLabel={t('events.backToEvents')}
      />
    );
  }

  const voting = event.canVote;
  return (
    <div className="vote-layout">
      <Link to={backTo} className="back-link">
        {t('events.backToEvents')}
      </Link>
      <div className="vote-head">
        <div className="vote-head__top">
          <h1>{event.title}</h1>
          <StateBadge state={event.state} />
        </div>
        <div className="event-row__meta">
          <span>
            <CalendarDays aria-hidden="true" /> {formatDateRange(event.startTime, event.endTime, lang)}
          </span>
          {event.clubName && (
            <span>
              <Users aria-hidden="true" /> {event.clubName}
            </span>
          )}
          {event.state === 'open' && <Countdown to={event.endTime} prefix={t('events.endsIn')} />}
        </div>
        {event.description && <p className="muted" dir="auto" style={{ marginTop: 10 }}>{event.description}</p>}
      </div>

      {showReceipt?.already && (
        <Alert variant="success" title={t('vote.alreadyVotedTitle')}>
          <span>{t('vote.alreadyVotedShort', { id: showReceipt.receiptCode })} </span>
          {showReceipt.votedAt && <span className="muted">({formatDateTime(showReceipt.votedAt, lang)})</span>}
        </Alert>
      )}
      {event.state === 'scheduled' && (
        <Alert variant="info" title={t('events.notStartedTitle')}>
          {t('events.notStartedText', { time: formatDateTime(event.startTime, lang) })} <Countdown to={event.startTime} />
        </Alert>
      )}
      {['closed', 'results_published'].includes(event.state) && (
        <Alert variant="warning" title={t('events.endedTitle')} actions={event.resultsPublished ? <Button size="sm" variant="primary" to="/results">{t('events.viewResults')}</Button> : null}>
          {event.resultsPublished ? t('events.endedResults') : t('events.endedNoResults')}
        </Alert>
      )}

      <Card className="question-card" style={{ marginTop: 18 }}>
        <h2>{t('events.question')}</h2>
        <p dir="auto">{event.question}</p>
      </Card>

      <h2 style={{ fontSize: 18, margin: '24px 0 12px' }}>{voting ? t('events.chooseOne') : t('events.options')}</h2>
      <div className="options" role={voting ? 'radiogroup' : 'list'} aria-label={t('events.options')}>
        {event.options.map((option) =>
          voting ? (
            <label key={option.id} className="option-card">
              <input type="radio" name="option" value={option.id} checked={selected === option.id} onChange={() => setSelected(option.id)} />
              <OptionMedia option={option} />
              <span className="option-card__body">
                <span className="option-card__title" dir="auto" style={{ display: 'block' }}>{option.title}</span>
                {option.description && <span className="option-card__desc" dir="auto" style={{ display: 'block' }}>{option.description}</span>}
              </span>
              <span className="option-card__radio" aria-hidden="true" />
            </label>
          ) : (
            <div key={option.id} className="option-card option-card--static" role="listitem">
              <OptionMedia option={option} />
              <div className="option-card__body">
                <div className="option-card__title" dir="auto">{option.title}</div>
                {option.description && <div className="option-card__desc" dir="auto">{option.description}</div>}
              </div>
            </div>
          )
        )}
      </div>

      {voting && (
        <VoteSubmission
          selected={selected}
          selectedLabel={chosen?.title}
          selectedMedia={chosen ? <OptionMedia option={chosen} /> : null}
          requestChallenge={() => eventApi.requestVerification(event.id)}
          cast={({ challengeId, code }) => eventApi.vote(event.id, { optionId: selected, challengeId, code })}
          onDone={(result) => {
            setReceipt({ receiptCode: result.receiptCode, votedAt: new Date().toISOString() });
            reload({ silent: true });
          }}
          onFailure={(err) => {
            if (['event_closed', 'already_voted', 'event_not_found'].includes(err?.code)) reload({ silent: true });
          }}
        />
      )}
      {!voting && event.state === 'open' && !event.hasVoted && (
        <p className="muted sm" style={{ marginTop: 14 }}>
          <Clock size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('events.cannotVote')}
        </p>
      )}
    </div>
  );
}
