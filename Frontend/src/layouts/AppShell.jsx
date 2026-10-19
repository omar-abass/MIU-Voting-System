import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Heart,
  Landmark,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Settings,
  Trophy,
  UserCircle,
  Users,
  UsersRound,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { Avatar, Logo } from '../components/common/Display.jsx';
import { LanguageToggle, ThemeToggle } from '../components/common/Toggles.jsx';

const STUDENT_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'nav.dashboard', end: true },
  { to: '/events/university', icon: Landmark, label: 'nav.universityEvents' },
  { to: '/events/clubs', icon: UsersRound, label: 'nav.clubEvents' },
  { to: '/competitions', icon: Trophy, label: 'nav.competition' },
  { to: '/clubs', icon: Heart, label: 'nav.myClubs' },
  { to: '/results', icon: BarChart3, label: 'nav.results' }
];

const MANAGER_NAV = [{ to: '/manager', icon: Briefcase, label: 'nav.managerPanel' }];

const ADMIN_NAV = [
  { to: '/admin', icon: LayoutDashboard, label: 'nav.overview', end: true },
  { to: '/admin/users', icon: Users, label: 'nav.users' },
  { to: '/admin/faculties', icon: GraduationCap, label: 'nav.faculties' },
  { to: '/admin/clubs', icon: Layers, label: 'nav.clubs' },
  { to: '/admin/events', icon: CalendarCheck, label: 'nav.events' },
  { to: '/admin/competitions', icon: Trophy, label: 'nav.competitions' },
  { to: '/admin/audit', icon: ClipboardList, label: 'nav.audit' },
  { to: '/admin/settings', icon: Settings, label: 'nav.systemSettings' }
];

const ACCOUNT_NAV = [{ to: '/profile', icon: UserCircle, label: 'nav.profile' }];
const PREFS_NAV = [{ to: '/settings', icon: Settings, label: 'nav.settings' }];

function NavItem({ item, onNavigate }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end={item.end} className="nav-link" onClick={onNavigate}>
      <Icon aria-hidden="true" />
      <span>{t(item.label)}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const compact = useMediaQuery('(max-width: 1024px)');
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  useEffect(() => {
    if (!compact) setOpen(false);
  }, [compact]);

  const isAdmin = user.role === 'admin';
  const isManager = user.role === 'club_manager';
  const sections = isAdmin
    ? [{ items: ADMIN_NAV }, { title: 'nav.account', items: ACCOUNT_NAV }]
    : [{ items: STUDENT_NAV }, ...(isManager ? [{ title: 'nav.manage', items: MANAGER_NAV }] : []), { title: 'nav.account', items: [...ACCOUNT_NAV, ...PREFS_NAV] }];

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const closedDrawer = compact && !open;

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        {t('common.skipToContent')}
      </a>
      {open && <div className="sidebar-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside className="sidebar" data-open={open} id="app-sidebar" aria-label={t('nav.mainNavigation')} inert={closedDrawer ? '' : undefined}>
        <div className="sidebar__brand">
          <Logo light to={isAdmin ? '/admin' : '/dashboard'} />
          {isAdmin && <span className="admin-tag">{t('roles.admin')}</span>}
        </div>
        <div className="sidebar__user">
          <Avatar user={user} />
          <div>
            <div className="sidebar__user-name">{user.username}</div>
            <div className="sidebar__user-role">{t(`roles.${user.role}`)}</div>
          </div>
        </div>
        <nav className="sidebar__nav">
          {sections.map((section, index) => (
            <div key={index} style={{ display: 'contents' }}>
              {section.title && <div className="sidebar__section">{t(section.title)}</div>}
              {section.items.map((item) => (
                <NavItem key={item.to} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar__footer">
          <button type="button" className="nav-link" onClick={onLogout}>
            <LogOut aria-hidden="true" className="flip-rtl" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn topbar__menu"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="app-sidebar"
            aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
          <div className="topbar__spacer" />
          <div className="topbar__tools">
            <ThemeToggle />
            <LanguageToggle />
            <NavLink to="/profile" className="profile-btn" aria-label={t('nav.profile')}>
              <span>{user.username}</span>
              <Avatar user={user} />
            </NavLink>
          </div>
        </header>
        <main id="main" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
