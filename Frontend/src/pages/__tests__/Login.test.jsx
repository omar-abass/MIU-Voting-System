import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { ApiError } from '../../services/api.js';

vi.mock('../../services/endpoints.js', () => ({
  authApi: { me: vi.fn(), login: vi.fn(), logout: vi.fn() },
  userApi: { me: vi.fn() }
}));

import { authApi } from '../../services/endpoints.js';
import Login from '../public/Login.jsx';
import { renderApp, resetEnvironment, studentUser } from '../../test/utils.jsx';

function renderLogin(route = '/login') {
  return renderApp(
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<div>student dashboard</div>} />
      <Route path="/admin" element={<div>admin console</div>} />
    </Routes>,
    { route }
  );
}

describe('Login page', () => {
  beforeEach(async () => {
    await resetEnvironment();
    vi.clearAllMocks();
    authApi.me.mockRejectedValue(new ApiError(401, 'unauthorized'));
  });

  it('asks for both fields before calling the API', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getAllByText('This field is required.')).toHaveLength(2);
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('shows a translated error, clears the password and stays on the page after wrong credentials', async () => {
    const user = userEvent.setup();
    authApi.login.mockRejectedValue(new ApiError(401, 'invalid_credentials', 'Invalid credentials'));
    renderLogin();
    await user.type(screen.getByLabelText('Username, email or student ID'), 'student_one');
    await user.type(screen.getByLabelText('Password'), 'WrongPass1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('The username or password is incorrect.')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.queryByText('student dashboard')).not.toBeInTheDocument();
  });

  it('signs a student in and opens the dashboard', async () => {
    const user = userEvent.setup();
    authApi.login.mockResolvedValue({ user: studentUser, csrfToken: 'csrf-1' });
    renderLogin();
    await user.type(screen.getByLabelText('Username, email or student ID'), '  student_one ');
    await user.type(screen.getByLabelText('Password'), 'Abcdef12');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('student dashboard')).toBeInTheDocument();
    expect(authApi.login).toHaveBeenCalledWith({ identifier: 'student_one', password: 'Abcdef12' });
  });

  it('sends an administrator to the admin console', async () => {
    const user = userEvent.setup();
    authApi.login.mockResolvedValue({ user: { ...studentUser, role: 'admin', username: 'root_admin' }, csrfToken: 'csrf-2' });
    renderLogin();
    await user.type(screen.getByLabelText('Username, email or student ID'), 'root_admin');
    await user.type(screen.getByLabelText('Password'), 'Abcdef12');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('admin console')).toBeInTheDocument();
  });

  it('can reveal and hide the typed password', async () => {
    const user = userEvent.setup();
    renderLogin();
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /show password/i }));
    await waitFor(() => expect(input).toHaveAttribute('type', 'text'));
    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('shows the network error text when the API is unreachable', async () => {
    const user = userEvent.setup();
    authApi.login.mockRejectedValue(new ApiError(0, 'network_error'));
    renderLogin();
    await user.type(screen.getByLabelText('Username, email or student ID'), 'student_one');
    await user.type(screen.getByLabelText('Password'), 'Abcdef12');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

