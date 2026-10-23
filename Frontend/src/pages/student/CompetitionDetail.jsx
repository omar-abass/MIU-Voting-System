import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Crown, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { competitionApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { assetUrl } from '../../utils/env.js';
import { formatDateRange, formatDateTime, formatNumber, formatPercent, initials } from '../../utils/format.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge, Countdown, StateBadge } from '../../components/common/Display.jsx';
import { Alert, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { HBarChart } from '../../components/charts/Charts.jsx';
import { VoteReceipt } from '../../components/voting/VoteReceipt.jsx';
import { VoteSubmission } from '../../components/voting/VoteSubmission.jsx';

function ContenderImage({ club }) {
  const src = assetUrl(club.imagePath ?? club.logoPath);
  return <div className="contender__img">{src ? <img src={src} alt="" /> : initials(club.name)}</div>;
}

function ContenderThumb({ club }) {
  const src = assetUrl(club.imagePath ?? club.logoPath);
  return <div className="option-card__media">{src ? <img src={src} alt="" /> : initials(club.name)}</div>;
}

export default function CompetitionDetail() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { competitionId } = useParams();
  const { data: comp, loading, error, rawError, reload } = useApi(() => competitionApi.get(competitionId), [competitionId]);
  const [selected, setSelected] = useState(null);
  const [receipt, setReceipt] = useState(null);
  useDocumentTitle(comp?.title);

  if (loading && !comp) return <ListSkeleton rows={3} height={120} />;
  if (rawError) {
    return (
      <>
        <Link to="/competitions" className="back-link">
          {t('competitions.back')}
        </Link>
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      </>
    );
  }
  if (!comp) return null;

  if (receipt) {
    return (
      <VoteReceipt
        label={t('competitions.receiptLabel')}
        title={comp.title}
        receiptCode={receipt.receiptCode}
        votedAt={receipt.votedAt}
        backTo="/competitions"
        backLabel={t('competitions.back')}
      />
    );
  }

  const voting = comp.canVote;
  const chosen = comp.clubs.find((c) => c.clubId === selected);
  const winners = new Set(comp.winners ?? []);

  return (
    <div className="vote-layout" style={{ maxWidth: 900 }}>
      <Link to="/competitions" className="back-link">
        {t('competitions.back')}
      </Link>
      <div className="vote-head">
        <div className="vote-head__top">
          <h1>{comp.title}</h1>
          <StateBadge state={comp.state} />
          {comp.isLive && (
            <Badge variant="danger">
              <Radio size={13} aria-hidden="true" /> {t('competitions.live')}
            </Badge>
          )}
        </div>
        <div className="event-row__meta">
          <span>
            <CalendarDays aria-hidden="true" /> {formatDateRange(comp.startTime, comp.endTime, lang)}
          </span>
          {comp.state === 'open' && <Countdown to={comp.endTime} prefix={t('events.endsIn')} />}
        </div>
        {comp.description && <p className="muted" dir="auto" style={{ marginTop: 10 }}>{comp.description}</p>}
      </div>

      {comp.hasVoted && (
        <Alert variant="success" title={t('vote.alreadyVotedTitle')}>
          {t('vote.alreadyVotedShort', { id: comp.receiptCode })}
        </Alert>
      )}
      {comp.state === 'scheduled' && (
        <Alert variant="info" title={t('events.notStartedTitle')}>
          {t('events.notStartedText', { time: formatDateTime(comp.startTime, lang) })} <Countdown to={comp.startTime} />
        </Alert>
      )}
      {['closed', 'results_published'].includes(comp.state) && !comp.resultsVisible && (
        <Alert variant="warning" title={t('events.endedTitle')}>
          {t('events.endedNoResults')}
        </Alert>
      )}
      {voting && !comp.resultsVisible && (
        <Alert variant="info">{t('competitions.hiddenResults')}</Alert>
      )}

      <Card style={{ marginTop: 18 }}>
        <h2 className="card__title" style={{ marginBottom: 14 }}>
          {voting ? t('competitions.chooseOne') : t('competitions.contenders')}
        </h2>
        <div className="contenders" role={voting ? 'radiogroup' : 'list'} aria-label={t('competitions.contenders')}>
          {comp.clubs.map((club) => {
            const isWinner = comp.resultsVisible && winners.has(club.clubId) && comp.resultsPublished;
            const body = (
              <>
                {isWinner && (
                  <span className="contender__crown">
                    <Crown aria-hidden="true" /> {t('competitions.winner')}
                  </span>
                )}
                <ContenderImage club={club} />
                <div className="contender__name" dir="auto">{club.name}</div>
                {comp.resultsVisible && (
                  <>
                    <div className="contender__votes">{formatNumber(club.votes, lang)}</div>
                    <div className="muted sm">{formatPercent(club.percentage, lang)}</div>
                  </>
                )}
              </>
            );
            return voting ? (
              <label key={club.clubId} className={`contender${isWinner ? ' contender--winner' : ''}`} data-clickable="true">
                <input type="radio" name="club" value={club.clubId} checked={selected === club.clubId} onChange={() => setSelected(club.clubId)} />
                {body}
              </label>
            ) : (
              <div key={club.clubId} role="listitem" className={`contender${isWinner ? ' contender--winner' : ''}`}>
                {body}
              </div>
            );
          })}
        </div>
      </Card>

      {comp.resultsVisible && (
        <Card style={{ marginTop: 18 }}>
          <HBarChart
            title={comp.isLive ? t('competitions.liveResults') : t('competitions.finalResults')}
            subtitle={t('competitions.totalVotes', { n: formatNumber(comp.totalVotes, lang) })}
            valueLabel={t('results.votes')}
            data={comp.clubs.map((c) => ({ key: c.clubId, name: c.name, value: c.votes }))}
            colorByIndex
          />
          {comp.isTie && <p className="muted sm" style={{ marginTop: 10 }}>{t('results.tieNote')}</p>}
        </Card>
      )}

      {voting && (
        <VoteSubmission
          selected={selected}
          selectedLabel={chosen?.name}
          selectedMedia={chosen ? <ContenderThumb club={chosen} /> : null}
          requestChallenge={() => competitionApi.requestVerification(comp.id)}
          cast={({ challengeId, code }) => competitionApi.vote(comp.id, { clubId: selected, challengeId, code })}
          onDone={(result) => {
            setReceipt({ receiptCode: result.receiptCode, votedAt: new Date().toISOString() });
            reload({ silent: true });
          }}
          onFailure={(err) => {
            if (['event_closed', 'already_voted', 'competition_not_found'].includes(err?.code)) reload({ silent: true });
          }}
        />
      )}
      {!voting && comp.state === 'open' && !comp.hasVoted && (
        <Button variant="soft" to="/competitions" style={{ marginTop: 14 }}>{t('competitions.back')}</Button>
      )}
    </div>
  );
}
