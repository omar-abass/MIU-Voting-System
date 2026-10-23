import { Link } from 'react-router-dom';
import { CalendarClock, CheckSquare, Trophy, Vote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { competitionApi, eventApi } from '../../services/endpoints.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { APP_TIMEZONE } from '../../utils/env.js';
import { facultyName } from '../../utils/names.js';
import { Avatar, Badge, StatCard } from '../../components/common/Display.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { EventRow } from '../../components/voting/EventRow.jsx';

function greetingKey() {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: APP_TIMEZONE }).format(new Date()));
  if (hour < 12) return 'dashboard.goodMorning';
  if (hour < 18) return 'dashboard.goodAfternoon';
  return 'dashboard.goodEvening';
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { user } = useAuth();
  useDocumentTitle(t('nav.dashboard'));

  const { data, loading, error, reload } = useApi(async () => {
    const [university, clubs, competitions] = await Promise.all([eventApi.university(), eventApi.clubs(), competitionApi.list()]);
    return { events: [...university.events, ...clubs.events], competitions };
  }, []);

  const events = data?.events ?? [];
  const accessible = events.filter((e) => !e.locked);
  const competitions = data?.competitions ?? [];
  const activeCount = accessible.filter((e) => e.state === 'open').length + competitions.filter((c) => c.state === 'open').length;
  const votedCount = accessible.filter((e) => e.hasVoted).length + competitions.filter((c) => c.hasVoted).length;
  const completedCount = accessible.filter((e) => ['closed', 'results_published'].includes(e.state)).length;
  const upcoming = accessible.filter((e) => ['open', 'scheduled'].includes(e.state)).slice(0, 4);
  const pendingCompetitions = competitions.filter((c) => c.canVote);

  return (
    <div className="dash">
      <div>
        <div className="welcome">
          <h1>
            {t(greetingKey())}{t('dashboard.greetingSeparator')}<bdi>{user.username}</bdi>!
          </h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>

        <div className="grid grid--3" style={{ marginTop: 22 }}>
          <StatCard icon={CheckSquare} label={t('dashboard.activeElections')} value={loading ? '–' : activeCount} />
          <StatCard icon={Vote} label={t('dashboard.myVotes')} value={loading ? '–' : votedCount} />
          <StatCard icon={CalendarClock} label={t('dashboard.completedElections')} value={loading ? '–' : completedCount} />
        </div>

        {pendingCompetitions.length > 0 && (
          <Card className="card--flat" style={{ marginTop: 22, background: 'var(--primary-soft)' }}>
            <div className="row row--between">
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <Trophy aria-hidden="true" style={{ color: 'var(--primary-text)' }} />
                <div>
                  <div className="bold">{pendingCompetitions[0].title}</div>
                  <div className="muted sm">{t('dashboard.competitionOpen')}</div>
                </div>
              </div>
              <Button variant="primary" to={`/competitions/${pendingCompetitions[0].id}`}>
                {t('events.voteNow')}
              </Button>
            </div>
          </Card>
        )}

        <div className="section-head">
          <h2>{t('dashboard.upcomingElections')}</h2>
          <Link to="/events/university">{t('dashboard.viewAll')}</Link>
        </div>
        {loading ? (
          <ListSkeleton rows={2} />
        ) : error ? (
          <Card>
            <ErrorState error={error} onRetry={reload} />
          </Card>
        ) : upcoming.length === 0 ? (
          <Card>
            <EmptyState icon={Vote} title={t('dashboard.noUpcoming')} text={t('dashboard.noUpcomingText')} />
          </Card>
        ) : (
          <div className="event-list">
            {upcoming.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        )}
      </div>

      <aside className="dash__aside" aria-label={t('dashboard.profileSummary')}>
        <Card>
          <div className="profile-summary">
            <Avatar user={user} />
            <div style={{ minWidth: 0 }}>
              <div className="bold truncate">{user.username}</div>
              <div className="muted sm truncate">{user.faculty ? facultyName(user.faculty, lang) : t(`roles.${user.role}`)}</div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="faint sm bold" style={{ marginBottom: 8 }}>
              {t('dashboard.myClubs')} ({user.subscriptions.length}/{user.subscriptionLimit})
            </div>
            {user.subscriptions.length ? (
              <div className="chip-list">
                {user.subscriptions.map((c) => (
                  <span className="chip" key={c.id}>
                    {c.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted sm">{t('dashboard.noClubs')}</p>
            )}
            <Button size="sm" variant="soft" to="/clubs" style={{ marginTop: 14 }}>
              {user.subscriptions.length ? t('dashboard.manageClubs') : t('dashboard.browseClubs')}
            </Button>
          </div>
          {user.role === 'club_manager' && (
            <div style={{ marginTop: 16 }}>
              <Badge variant="primary">{t('roles.club_manager')}</Badge>
            </div>
          )}
        </Card>
      </aside>
    </div>
  );
}
