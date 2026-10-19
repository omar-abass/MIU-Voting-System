import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n/index.js';
import { ThemeProvider } from '../contexts/ThemeContext.jsx';
import { LanguageProvider } from '../contexts/LanguageContext.jsx';
import { ToastProvider } from '../contexts/ToastContext.jsx';
import { ConfirmProvider } from '../contexts/ConfirmContext.jsx';
import { ROUTER_FUTURE } from '../App.jsx';
import { AuthProvider } from '../contexts/AuthContext.jsx';

/** A signed-in student as the API returns it (never contains a password hash or a full phone number). */
export const studentUser = {
  id: 7,
  username: 'student_one',
  email: 'student.one@example.com',
  role: 'student',
  phoneVerified: true,
  phoneMasked: '+20 10******78',
  studentIdMasked: '****4321',
  faculty: { id: 2, nameEn: 'Faculty of Engineering', nameAr: 'كلية الهندسة' },
  avatarPath: null,
  createdAt: '2026-01-10T09:00:00.000Z',
  lastLoginAt: '2026-10-01T09:00:00.000Z'
};

export const faculties = [
  { id: 1, nameEn: 'Faculty of Business', nameAr: 'كلية إدارة الأعمال' },
  { id: 2, nameEn: 'Faculty of Engineering', nameAr: 'كلية الهندسة' }
];

/** Always start each test in English with a clean <html>. */
export async function resetEnvironment() {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
  await i18n.changeLanguage('en');
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.setAttribute('lang', 'en');
  document.documentElement.setAttribute('dir', 'ltr');
}

/** Renders `ui` inside every provider the real app mounts (same order as main.jsx). */
export function renderApp(ui, { route = '/' } = {}) {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <MemoryRouter initialEntries={[route]} future={ROUTER_FUTURE}>{ui}</MemoryRouter>
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

/** Providers without Auth (for pieces that do not need a session). */
export function renderPlain(ui, { route = '/' } = {}) {
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <ConfirmProvider>
            <MemoryRouter initialEntries={[route]} future={ROUTER_FUTURE}>{ui}</MemoryRouter>
          </ConfirmProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export { i18n };
