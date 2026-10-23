import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';

vi.mock('../../services/endpoints.js', () => ({
  authApi: { me: vi.fn(), logout: vi.fn() },
  userApi: {}
}));

import { authApi } from '../../services/endpoints.js';
import { AppShell } from '../AppShell.jsx';
import { RequireAuth } from '../../routes/guards.jsx';
import { renderApp, resetEnvironment, studentUser } from '../../test/utils.jsx';

const originalMatchMedia = window.matchMedia;

function setViewport(compact) {
  window.matchMedia = (query) => ({
    matches: compact && query.includes('max-width: 1024px'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {}
  });
}

function renderShell(user, route = '/dashboard') {
  authApi.me.mockResolvedValue({ user, csrfToken: 'csrf' });
  return renderApp(
    <Routes>
      <Route path="/login" element={<div>login page</div>} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<div>dashboard content</div>} />
          <Route path="/events/university" element={<div>university events content</div>} />
          <Route path="/admin" element={<div>admin content</div>} />
        </Route>
      </Route>
    </Routes>,
    { route }
  );
}

const sidebar = () => document.getElementById('app-sidebar');

describe('AppShell navigation', () => {
  beforeEach(async () => {
    await resetEnvironment();
    vi.clearAllMocks();
    setViewport(false);
  });
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('shows the student menu (and no admin links) for a student', async () => {
    renderShell(studentUser);
    await screen.findByText('dashboard content');
    const nav = within(sidebar());
    for (const name of ['Dashboard', 'University events', 'Club events', 'Club competition', 'My clubs', 'Results', 'My profile', 'Settings']) {
      expect(nav.getByRole('link', { name })).toBeInTheDocument();
    }
    expect(nav.queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    expect(nav.queryByRole('link', { name: 'Audit log' })).not.toBeInTheDocument();
    expect(nav.queryByRole('link', { name: 'Club manager panel' })).not.toBeInTheDocument();
  });

  it('adds the manager panel for a club manager', async () => {
    renderShell({ ...studentUser, role: 'club_manager' });
    await screen.findByText('dashboard content');
    expect(within(sidebar()).getByRole('link', { name: 'Club manager panel' })).toBeInTheDocument();
  });

  it('shows the administration menu for an admin', async () => {
    renderShell({ ...studentUser, role: 'admin', username: 'root_admin' }, '/admin');
    await screen.findByText('admin content');
    const nav = within(sidebar());
    for (const name of ['Overview', 'Users', 'Faculties', 'Clubs', 'Events', 'Competitions', 'Audit log', 'System settings']) {
      expect(nav.getByRole('link', { name })).toBeInTheDocument();
    }
    expect(nav.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('sends visitors without a session to the login page', async () => {
    authApi.me.mockRejectedValue(new Error('no session'));
    renderApp(
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<div>dashboard content</div>} />
        </Route>
      </Routes>,
      { route: '/dashboard' }
    );
    expect(await screen.findByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('dashboard content')).not.toBeInTheDocument();
  });

  it('keeps students out of admin pages', async () => {
    authApi.me.mockResolvedValue({ user: studentUser, csrfToken: 'csrf' });
    renderApp(
      <Routes>
        <Route element={<RequireAuth roles={['admin']} />}>
          <Route path="/admin" element={<div>admin content</div>} />
        </Route>
        <Route path="/dashboard" element={<div>student home</div>} />
      </Routes>,
      { route: '/admin' }
    );
    expect(await screen.findByText('student home')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('logs out through the API and returns to the login page', async () => {
    const user = userEvent.setup();
    authApi.logout.mockResolvedValue({});
    renderShell(studentUser);
    await screen.findByText('dashboard content');
    await user.click(within(sidebar()).getByRole('button', { name: 'Log out' }));
    await waitFor(() => expect(authApi.logout).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });
});

describe('AppShell responsive drawer (narrow screens)', () => {
  beforeEach(async () => {
    await resetEnvironment();
    vi.clearAllMocks();
    setViewport(true);
  });
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('starts closed and unreachable by keyboard, then opens from the menu button', async () => {
    const user = userEvent.setup();
    renderShell(studentUser);
    await screen.findByText('dashboard content');
    expect(sidebar()).toHaveAttribute('data-open', 'false');
    expect(sidebar()).toHaveAttribute('inert');
    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    expect(sidebar()).toHaveAttribute('data-open', 'true');
    expect(sidebar()).not.toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.querySelector('.sidebar-overlay')).toBeInTheDocument();
  });

  it('closes with Escape', async () => {
    const user = userEvent.setup();
    renderShell(studentUser);
    await screen.findByText('dashboard content');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.keyboard('{Escape}');
    expect(sidebar()).toHaveAttribute('data-open', 'false');
  });

  it('closes when the overlay is clicked', async () => {
    const user = userEvent.setup();
    renderShell(studentUser);
    await screen.findByText('dashboard content');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(document.querySelector('.sidebar-overlay'));
    expect(sidebar()).toHaveAttribute('data-open', 'false');
    expect(document.querySelector('.sidebar-overlay')).not.toBeInTheDocument();
  });

  it('closes after choosing a page and shows that page', async () => {
    const user = userEvent.setup();
    renderShell(studentUser);
    await screen.findByText('dashboard content');
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(within(sidebar()).getByRole('link', { name: 'University events' }));
    expect(await screen.findByText('university events content')).toBeInTheDocument();
    expect(sidebar()).toHaveAttribute('data-open', 'false');
  });
});
