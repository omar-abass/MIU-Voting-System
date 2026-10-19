import React from 'react';
import { createRoot } from 'react-dom/client';
import './i18n/index.js';
import './styles/index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ConfirmProvider } from './contexts/ConfirmContext.jsx';
import { LanguageProvider } from './contexts/LanguageContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
