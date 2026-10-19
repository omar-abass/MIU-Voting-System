import { Suspense, lazy } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from './components/common/Feedback.jsx';
import { AppShell } from './layouts/AppShell.jsx';
import { AuthLayout } from './layouts/AuthLayout.jsx';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { PublicOnly, RequireAuth, VOTER_ROLES } from './routes/guards.jsx';
import { BASE_PATH, ROUTER_MODE } from './utils/env.js';

// Pages are code-split so the landing page stays light.
const Landing = lazy(() => import('./pages/public/Landing.jsx'));
const Login = lazy(() => import('./pages/public/Login.jsx'));
const Register = lazy(() => import('./pages/public/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/public/ForgotPassword.jsx'));
const NotFound = lazy(() => import('./pages/public/NotFound.jsx'));

const Dashboard = lazy(() => import('./pages/student/Dashboard.jsx'));
const EventsList = lazy(() => import('./pages/student/EventsList.jsx'));
const EventDetail = lazy(() => import('./pages/student/EventDetail.jsx'));
const Competitions = lazy(() => import('./pages/student/Competitions.jsx'));
const CompetitionDetail = lazy(() => import('./pages/student/CompetitionDetail.jsx'));
const Clubs = lazy(() => import('./pages/student/Clubs.jsx'));
const Results = lazy(() => import('./pages/student/Results.jsx'));
const Profile = lazy(() => import('./pages/student/Profile.jsx'));
const Settings = lazy(() => import('./pages/student/Settings.jsx'));

const ManagerHome = lazy(() => import('./pages/manager/ManagerHome.jsx'));
const ManagerClub = lazy(() => import('./pages/manager/ManagerClub.jsx'));
const ManagerEvent = lazy(() => import('./pages/manager/ManagerEvent.jsx'));
const ManagerEventForm = lazy(() => import('./pages/manager/ManagerEventForm.jsx'));

const AdminOverview = lazy(() => import('./pages/admin/AdminOverview.jsx'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminFaculties = lazy(() => import('./pages/admin/AdminFaculties.jsx'));
const AdminClubs = lazy(() => import('./pages/admin/AdminClubs.jsx'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents.jsx'));
const AdminEventForm = lazy(() => import('./pages/admin/AdminEventForm.jsx'));
const AdminEvent = lazy(() => import('./pages/admin/AdminEvent.jsx'));
const AdminCompetitions = lazy(() => import('./pages/admin/AdminCompetitions.jsx'));
const AdminCompetitionForm = lazy(() => import('./pages/admin/AdminCompetitionForm.jsx'));
const AdminCompetition = lazy(() => import('./pages/admin/AdminCompetition.jsx'));
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit.jsx'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings.jsx'));

const Fallback = () => (
  <div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
    <Spinner />
  </div>
);

const ADMIN = ['admin'];
const MANAGER = ['club_manager'];

export function AppRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
        </Route>

        <Route element={<PublicOnly />}>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
          </Route>
        </Route>

        {/* Students and club managers */}
        <Route element={<RequireAuth roles={VOTER_ROLES} />}>
          <Route element={<AppShell />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="events/university" element={<EventsList kind="university" />} />
            <Route path="events/clubs" element={<EventsList kind="clubs" />} />
            <Route path="events/:eventId" element={<EventDetail />} />
            <Route path="competitions" element={<Competitions />} />
            <Route path="competitions/:competitionId" element={<CompetitionDetail />} />
            <Route path="clubs" element={<Clubs />} />
            <Route path="results" element={<Results />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Club managers */}
        <Route element={<RequireAuth roles={MANAGER} />}>
          <Route element={<AppShell />}>
            <Route path="manager" element={<ManagerHome />} />
            <Route path="manager/clubs/:clubId" element={<ManagerClub />} />
            <Route path="manager/events/new" element={<ManagerEventForm />} />
            <Route path="manager/events/:eventId" element={<ManagerEvent />} />
            <Route path="manager/events/:eventId/edit" element={<ManagerEventForm />} />
          </Route>
        </Route>

        {/* Admins */}
        <Route element={<RequireAuth roles={ADMIN} />}>
          <Route element={<AppShell />}>
            <Route path="admin" element={<AdminOverview />} />
            <Route path="admin/users" element={<AdminUsers />} />
            <Route path="admin/faculties" element={<AdminFaculties />} />
            <Route path="admin/clubs" element={<AdminClubs />} />
            <Route path="admin/events" element={<AdminEvents />} />
            <Route path="admin/events/new" element={<AdminEventForm />} />
            <Route path="admin/events/:eventId" element={<AdminEvent />} />
            <Route path="admin/events/:eventId/edit" element={<AdminEventForm />} />
            <Route path="admin/competitions" element={<AdminCompetitions />} />
            <Route path="admin/competitions/new" element={<AdminCompetitionForm />} />
            <Route path="admin/competitions/:competitionId" element={<AdminCompetition />} />
            <Route path="admin/competitions/:competitionId/edit" element={<AdminCompetitionForm />} />
            <Route path="admin/audit" element={<AdminAudit />} />
            <Route path="admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>

        {/* Profile is available to every signed-in role */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        <Route path="home" element={<Navigate to="/" replace />} />
        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

// Opt in to the behaviour React Router 7 will make the default (also silences its console warnings).
export const ROUTER_FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true };

/** HashRouter is for static hosts that cannot rewrite unknown paths (e.g. GitHub Pages without the 404 trick). */
export default function App() {
  const Router = ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter;
  const props = ROUTER_MODE === 'hash' ? {} : { basename: BASE_PATH.replace(/\/$/, '') || undefined };
  return (
    <Router {...props} future={ROUTER_FUTURE}>
      <AppRoutes />
    </Router>
  );
}
