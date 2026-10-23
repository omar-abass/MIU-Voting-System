import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { ApiError } from '../../services/api.js';

vi.mock('../../services/endpoints.js', () => ({
  authApi: { me: vi.fn(), register: vi.fn(), verifyPhone: vi.fn(), resendOtp: vi.fn() },
  referenceApi: { faculties: vi.fn() },
  userApi: {}
}));

import { authApi, referenceApi } from '../../services/endpoints.js';
import Register from '../public/Register.jsx';
import { faculties, renderApp, resetEnvironment } from '../../test/utils.jsx';

const challenge = () => ({
  challengeId: 'chal-1',
  maskedPhone: '+20 10******78',
  expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
  resendAvailableAt: new Date(Date.now() + 60_000).toISOString()
});

function renderRegister() {
  return renderApp(
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<div>login page</div>} />
    </Routes>,
    { route: '/register' }
  );
}

async function fillValid(user, overrides = {}) {
  const v = { username: 'new_student', email: 'new@example.com', phone: '01012345678', studentId: '20230123', faculty: '2', password: 'Abcdef12', confirm: 'Abcdef12', ...overrides };
  await user.type(screen.getByLabelText('Username'), v.username);
  await user.type(screen.getByLabelText('Email address'), v.email);
  await user.type(screen.getByLabelText('Mobile number'), v.phone);
  await user.type(screen.getByLabelText('Student ID'), v.studentId);
  await user.selectOptions(screen.getByLabelText('Faculty'), v.faculty);
  await user.type(screen.getByLabelText('Password'), v.password);
  await user.type(screen.getByLabelText('Confirm password'), v.confirm);
}

describe('Register page', () => {
  beforeEach(async () => {
    await resetEnvironment();
    vi.clearAllMocks();
    authApi.me.mockRejectedValue(new ApiError(401, 'unauthorized'));
    referenceApi.faculties.mockResolvedValue(faculties);
  });

  it('shows a message for every empty field and does not call the API', async () => {
    const user = userEvent.setup();
    renderRegister();
    await screen.findByRole('option', { name: 'Faculty of Engineering' });
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    expect(screen.getAllByText('This field is required.').length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText('Choose your faculty.')).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('rejects a weak password, a mismatch and a non-Egyptian phone number', async () => {
    const user = userEvent.setup();
    renderRegister();
    await screen.findByRole('option', { name: 'Faculty of Engineering' });
    await fillValid(user, { phone: '0501234567', password: 'weakpass', confirm: 'different' });
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    expect(screen.getByText(/Enter a valid Egyptian mobile number/)).toBeInTheDocument();
    expect(screen.getByText(/Use at least 8 characters with an uppercase letter/)).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('flags mismatching passwords separately when the password itself is strong', async () => {
    const user = userEvent.setup();
    renderRegister();
    await screen.findByRole('option', { name: 'Faculty of Engineering' });
    await fillValid(user, { confirm: 'Abcdef13' });
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    expect(screen.getByText('The passwords do not match.')).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('submits normalised data (western digits, numeric faculty, no confirmation field) and asks for the SMS code', async () => {
    const user = userEvent.setup();
    authApi.register.mockResolvedValue(challenge());
    renderRegister();
    await screen.findByRole('option', { name: 'Faculty of Engineering' });
    await fillValid(user, { phone: '٠١٠١٢٣٤٥٦٧٨', studentId: '٢٠٢٣٠١٢٣' });
    await user.click(screen.getByRole('button', { name: 'Create an account' }));

    await waitFor(() => expect(authApi.register).toHaveBeenCalledTimes(1));
    expect(authApi.register).toHaveBeenCalledWith({
      username: 'new_student',
      email: 'new@example.com',
      phone: '01012345678',
      studentId: '20230123',
      facultyId: 2,
      password: 'Abcdef12'
    });
    expect(await screen.findByText('Verify your phone')).toBeInTheDocument();
    expect(screen.getByText('+20 10******78')).toBeInTheDocument();
    // the account is only created after the code is verified
    expect(authApi.verifyPhone).not.toHaveBeenCalled();
  });

  it('puts server-side field errors next to the field', async () => {
    const user = userEvent.setup();
    authApi.register.mockRejectedValue(new ApiError(400, 'validation_error', 'x', [{ field: 'email', message: 'validation.email' }]));
    renderRegister();
    await screen.findByRole('option', { name: 'Faculty of Engineering' });
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    const email = screen.getByLabelText('Email address');
    await waitFor(() => expect(email).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getAllByText('Enter a valid email address.').length).toBeGreaterThan(0);
  });

  it('shows a translated message when the username is already taken', async () => {
    const user = userEvent.setup();
    authApi.register.mockRejectedValue(new ApiError(409, 'username_taken', 'Username already exists'));
    renderRegister();
    await screen.findByRole('option', { name: 'Faculty of Engineering' });
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent('Username already exists'); // raw server text is never shown
    expect(alert.textContent.length).toBeGreaterThan(5);
  });

  it('verifies the 6-digit code and then sends the person to sign in', async () => {
    const user = userEvent.setup();
    authApi.register.mockResolvedValue(challenge());
    authApi.verifyPhone.mockResolvedValue({ verified: true });
    renderRegister();
    await screen.findByRole('option', { name: 'Faculty of Engineering' });
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await screen.findByText('Verify your phone');

    const group = screen.getByRole('group', { name: 'Verification code' });
    expect(within(group).getAllByRole('textbox')).toHaveLength(6);
    await user.keyboard('123456');
    await waitFor(() => expect(authApi.verifyPhone).toHaveBeenCalledWith({ challengeId: 'chal-1', code: '123456' }));
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });

  it('keeps the person on the code step and shows the error when the code is wrong', async () => {
    const user = userEvent.setup();
    authApi.register.mockResolvedValue(challenge());
    authApi.verifyPhone.mockRejectedValue(new ApiError(400, 'otp_invalid', 'Invalid code'));
    renderRegister();
    await screen.findByRole('option', { name: 'Faculty of Engineering' });
    await fillValid(user);
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    await screen.findByText('Verify your phone');
    await user.keyboard('000000');
    expect(await screen.findByText('The code is incorrect. Check the SMS and try again.')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});

