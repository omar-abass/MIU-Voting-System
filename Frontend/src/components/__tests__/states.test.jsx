import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { ApiError } from '../../services/api.js';

vi.mock('../../services/endpoints.js', () => ({
  authApi: { me: vi.fn() },
  userApi: {},
  adminApi: { auditLogs: vi.fn(), verifyAudit: vi.fn() }
}));

import { adminApi, authApi } from '../../services/endpoints.js';
import AdminAudit from '../../pages/admin/AdminAudit.jsx';
import { RequireAuth } from '../../routes/guards.jsx';
import { EmptyState, ErrorState, ListSkeleton } from '../common/Feedback.jsx';
import { Pagination } from '../common/Display.jsx';
import { renderApp, renderPlain, resetEnvironment, studentUser } from '../../test/utils.jsx';

const adminUser = { ...studentUser, role: 'admin', username: 'root_admin' };

function renderAudit() {
  authApi.me.mockResolvedValue({ user: adminUser, csrfToken: 'csrf' });
  return renderApp(
    <Routes>
      <Route element={<RequireAuth roles={['admin']} />}>
        <Route path="/admin/audit" element={<AdminAudit />} />
      </Route>
    </Routes>,
    { route: '/admin/audit' }
  );
}

describe('shared states', () => {
  beforeEach(async () => {
    await resetEnvironment();
    vi.clearAllMocks();
  });

  it('EmptyState renders title and text', () => {
    renderPlain(<EmptyState icon={Inbox} title="Nothing here" text="Come back later." />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Come back later.')).toBeInTheDocument();
  });

  it('ErrorState is announced as an alert and offers a retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderPlain(<ErrorState error="Could not load" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ListSkeleton is exposed to assistive tech as a loading status', () => {
    renderPlain(<ListSkeleton rows={2} />);
    expect(screen.getByRole('status', { name: 'Loading…' })).toHaveAttribute('aria-busy', 'true');
  });

  it('Pagination disables the edge buttons and reports the chosen page', async () => {
    const user = userEvent.setup();
    const onPage = vi.fn();
    renderPlain(<Pagination meta={{ page: 1, totalPages: 3, total: 50, pageSize: 20 }} onPage={onPage} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled();
    await user.click(buttons[buttons.length - 1]);
    expect(onPage).toHaveBeenCalledWith(2);
  });
});

describe('admin audit page states', () => {
  beforeEach(async () => {
    await resetEnvironment();
    vi.clearAllMocks();
  });

  it('shows an empty state when there are no log entries', async () => {
    adminApi.auditLogs.mockResolvedValue({ items: [], meta: { page: 1, totalPages: 1, total: 0, pageSize: 20 } });
    renderAudit();
    expect(await screen.findByText('No entries yet')).toBeInTheDocument();
  });

  it('shows a translated error with a working retry button', async () => {
    const user = userEvent.setup();
    adminApi.auditLogs.mockRejectedValueOnce(new ApiError(500, 'internal_error', 'secret stack trace'));
    adminApi.auditLogs.mockResolvedValueOnce({ items: [], meta: { page: 1, totalPages: 1, total: 0, pageSize: 20 } });
    renderAudit();
    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent('secret stack trace');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('No entries yet')).toBeInTheDocument();
  });

  it('lists entries as plain text and reports a verified chain', async () => {
    const user = userEvent.setup();
    adminApi.auditLogs.mockResolvedValue({
      items: [
        {
          id: 5,
          createdAt: '2026-10-01T10:00:00.000Z',
          actorUsername: 'root_admin',
          actorRole: 'admin',
          action: 'event.publish',
          entityType: 'event',
          entityId: 12,
          details: { title: '<img src=x onerror=alert(1)>' }
        }
      ],
      meta: { page: 1, totalPages: 1, total: 1, pageSize: 20 }
    });
    adminApi.verifyAudit.mockResolvedValue({ valid: true, checked: 1 });
    renderAudit();
    expect(await screen.findByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull(); // rendered as text, never as HTML
    await user.click(screen.getByRole('button', { name: 'Verify integrity' }));
    await waitFor(() => expect(adminApi.verifyAudit).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/1/, { selector: '.alert__body' })).toBeInTheDocument();
  });

  it('warns when the audit chain is broken', async () => {
    const user = userEvent.setup();
    adminApi.auditLogs.mockResolvedValue({
      items: [{ id: 1, createdAt: '2026-10-01T10:00:00.000Z', actorUsername: null, actorRole: 'system', action: 'user.login', entityType: null, entityId: null, details: null }],
      meta: { page: 1, totalPages: 1, total: 1, pageSize: 20 }
    });
    adminApi.verifyAudit.mockResolvedValue({ valid: false, checked: 1, brokenAtId: 1 });
    renderAudit();
    await screen.findByRole('button', { name: 'Verify integrity' });
    await user.click(screen.getByRole('button', { name: 'Verify integrity' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
