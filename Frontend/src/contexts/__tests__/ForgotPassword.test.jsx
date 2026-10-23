import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { ApiError } from '../../services/api.js';

vi.mock('../../services/endpoints.js', () => ({
  authApi: { me: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn() },
  userApi: {}
}));

import { authApi } from '../../services/endpoints.js';
import ForgotPassword from '../public/ForgotPassword.jsx';
import { renderApp, resetEnvironment } from '../../test/utils.jsx';

function renderPage() {
  return renderApp(
    <Routes>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/login" element={<div>login page</div>} />
    </Routes>,
    { route: '/forgot-password' }
  );
}

describe('Forgot password flow', () => {
  beforeEach(async () => {
    await resetEnvironment();
    vi.clearAllMocks();
    authApi.me.mockRejectedValue(new ApiError(401, 'unauthorized'));
    authApi.forgotPassword.mockResolvedValue({ challengeId: 'reset-1', ttlSeconds: 300 });
  });

  it('requires an identifier', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Send verification code' }));
    expect(screen.getByText('This field is required.')).toBeInTheDocument();
    expect(authApi.forgotPassword).not.toHaveBeenCalled();
  });

  it('moves to the reset step, focuses the new-password field first, and resets with the typed code', async () => {
    const user = userEvent.setup();
    authApi.resetPassword.mockResolvedValue({});
    renderPage();
    await user.type(screen.getByLabelText('Username, email or student ID'), 'student_one');
    await user.click(screen.getByRole('button', { name: 'Send verification code' }));
    expect(await screen.findByRole('heading', { name: 'Choose a new password' })).toBeInTheDocument();
    expect(authApi.forgotPassword).toHaveBeenCalledWith('student_one');
    // the person fills in the passwords first, then the code (typing the code last submits automatically)
    await waitFor(() => expect(screen.getByLabelText('New password')).toHaveFocus());

    await user.keyboard('NewPassw0rd');
    await user.type(screen.getByLabelText('Confirm password'), 'NewPassw0rd');
    await user.click(screen.getAllByRole('textbox')[0]);
    await user.keyboard('135790');
    await waitFor(() => expect(authApi.resetPassword).toHaveBeenCalledTimes(1));
    expect(authApi.resetPassword).toHaveBeenCalledWith({ challengeId: 'reset-1', code: '135790', newPassword: 'NewPassw0rd', confirmPassword: 'NewPassw0rd' });
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });

  it('does not contact the server to reset when the new password is weak', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Username, email or student ID'), 'student_one');
    await user.click(screen.getByRole('button', { name: 'Send verification code' }));
    await screen.findByRole('heading', { name: 'Choose a new password' });
    await user.keyboard('weak');
    await user.type(screen.getByLabelText('Confirm password'), 'weak');
    await user.click(screen.getAllByRole('textbox')[0]);
    await user.keyboard('135790');
    expect(await screen.findByText(/Use at least 8 characters/)).toBeInTheDocument();
    expect(authApi.resetPassword).not.toHaveBeenCalled();
  });
});
