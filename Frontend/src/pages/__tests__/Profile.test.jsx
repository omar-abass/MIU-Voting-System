import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { ApiError } from '../../services/api.js';

vi.mock('../../services/endpoints.js', () => ({
  authApi: { me: vi.fn(), requestPasswordChange: vi.fn(), confirmPasswordChange: vi.fn(), resendOtp: vi.fn() },
  referenceApi: { faculties: vi.fn() },
  userApi: { update: vi.fn(), me: vi.fn(), uploadAvatar: vi.fn() }
}));

import { authApi, referenceApi, userApi } from '../../services/endpoints.js';
import Profile from '../student/Profile.jsx';
import { RequireAuth } from '../../routes/guards.jsx';
import { faculties, renderApp, resetEnvironment, studentUser } from '../../test/utils.jsx';

const challenge = () => ({
  challengeId: 'pw-chal-1',
  maskedPhone: '+20 10******78',
  expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
  resendAvailableAt: new Date(Date.now() + 60_000).toISOString()
});

async function renderProfile() {
  authApi.me.mockResolvedValue({ user: studentUser, csrfToken: 'csrf' });
  renderApp(
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>,
    { route: '/profile' }
  );
  await screen.findByRole('heading', { name: 'My profile' });
  await screen.findByRole('option', { name: 'Faculty of Business' });
}

describe('Profile page', () => {
  beforeEach(async () => {
    await resetEnvironment();
    vi.clearAllMocks();
    referenceApi.faculties.mockResolvedValue(faculties);
  });

  it('shows the account details with masked phone and student ID, and locked-field note', async () => {
    await renderProfile();
    expect(screen.getByText('+20 10******78')).toBeInTheDocument();
    expect(screen.getByText('****4321')).toBeInTheDocument();
    expect(screen.getByText('student.one@example.com', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText(/Your student ID and phone number cannot be changed here/)).toBeInTheDocument();
    expect(screen.getByText('Phone verified')).toBeInTheDocument();
  });

  it('keeps Save disabled until something changes', async () => {
    const user = userEvent.setup();
    await renderProfile();
    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save).toBeDisabled();
    await user.type(screen.getByLabelText('Username'), '_x');
    expect(save).toBeEnabled();
  });

  it('sends only the changed fields and shows the updated profile', async () => {
    const user = userEvent.setup();
    userApi.update.mockResolvedValue({ ...studentUser, username: 'student_renamed' });
    await renderProfile();
    const username = screen.getByLabelText('Username');
    await user.clear(username);
    await user.type(username, 'student_renamed');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(userApi.update).toHaveBeenCalledTimes(1));
    expect(userApi.update).toHaveBeenCalledWith({ username: 'student_renamed' });
    expect(await screen.findByText('Your profile has been updated.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'student_renamed' })).toBeInTheDocument();
  });

  it('validates before calling the API', async () => {
    const user = userEvent.setup();
    await renderProfile();
    const email = screen.getByLabelText('Email address');
    await user.clear(email);
    await user.type(email, 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument();
    expect(userApi.update).not.toHaveBeenCalled();
  });

  it('shows a translated message when the new username is taken', async () => {
    const user = userEvent.setup();
    userApi.update.mockRejectedValue(new ApiError(409, 'username_taken', 'Username taken'));
    await renderProfile();
    await user.type(screen.getByLabelText('Username'), '2');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent('Username taken');
  });

  it('changes the password only after the SMS code is confirmed', async () => {
    const user = userEvent.setup();
    authApi.requestPasswordChange.mockResolvedValue(challenge());
    authApi.confirmPasswordChange.mockResolvedValue({});
    await renderProfile();
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change password' });

    await user.type(within(dialog).getByLabelText('Current password'), 'OldPassw0rd');
    await user.type(within(dialog).getByLabelText('New password'), 'NewPassw0rd');
    await user.type(within(dialog).getByLabelText('Confirm password'), 'NewPassw0rd');
    // typing into later fields must not drag focus back to the first one
    expect(within(dialog).getByLabelText('Confirm password')).toHaveValue('NewPassw0rd');
    expect(within(dialog).getByLabelText('Current password')).toHaveValue('OldPassw0rd');

    await user.click(within(dialog).getByRole('button', { name: 'Send verification code' }));
    await waitFor(() => expect(authApi.requestPasswordChange).toHaveBeenCalledTimes(1));
    expect(authApi.requestPasswordChange).toHaveBeenCalledWith({ currentPassword: 'OldPassw0rd', newPassword: 'NewPassw0rd', confirmPassword: 'NewPassw0rd' });
    expect(authApi.confirmPasswordChange).not.toHaveBeenCalled();

    expect(await within(dialog).findByText('+20 10******78')).toBeInTheDocument();
    await user.keyboard('654321');
    await waitFor(() => expect(authApi.confirmPasswordChange).toHaveBeenCalledWith({ challengeId: 'pw-chal-1', code: '654321' }));
    expect(await screen.findByText('Your password has been changed.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('rejects a weak new password and a mismatch without contacting the server', async () => {
    const user = userEvent.setup();
    await renderProfile();
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change password' });
    await user.type(within(dialog).getByLabelText('Current password'), 'OldPassw0rd');
    await user.type(within(dialog).getByLabelText('New password'), 'weak');
    await user.type(within(dialog).getByLabelText('Confirm password'), 'other');
    await user.click(within(dialog).getByRole('button', { name: 'Send verification code' }));
    expect(await within(dialog).findByText(/Use at least 8 characters/)).toBeInTheDocument();
    expect(within(dialog).getByText('The passwords do not match.')).toBeInTheDocument();
    expect(authApi.requestPasswordChange).not.toHaveBeenCalled();
  });

  it('shows the server message when the current password is wrong', async () => {
    const user = userEvent.setup();
    authApi.requestPasswordChange.mockRejectedValue(new ApiError(401, 'invalid_credentials', 'x'));
    await renderProfile();
    await user.click(screen.getByRole('button', { name: 'Change password' }));
    const dialog = await screen.findByRole('dialog', { name: 'Change password' });
    await user.type(within(dialog).getByLabelText('Current password'), 'WrongPassw0rd');
    await user.type(within(dialog).getByLabelText('New password'), 'NewPassw0rd');
    await user.type(within(dialog).getByLabelText('Confirm password'), 'NewPassw0rd');
    await user.click(within(dialog).getByRole('button', { name: 'Send verification code' }));
    expect(await within(dialog).findByText('The username or password is incorrect.')).toBeInTheDocument();
  });
});
