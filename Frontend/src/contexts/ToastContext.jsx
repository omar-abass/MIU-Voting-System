import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertTriangle, info: Info };

export function ToastProvider({ children }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (type, message, { title, duration = type === 'error' ? 7000 : 4500 } = {}) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((list) => [...list.slice(-3), { id, type, message, title }]);
      if (duration) setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m, o) => push('success', m, o),
      error: (m, o) => push('error', m, o),
      warning: (m, o) => push('warning', m, o),
      info: (m, o) => push('info', m, o),
      dismiss
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="region" aria-label={t('common.notifications')} aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type] ?? Info;
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={`toast toast--${toast.type}`}
                role={toast.type === 'error' ? 'alert' : 'status'}
              >
                <Icon aria-hidden="true" />
                <div className="toast__body">
                  {toast.title && <div className="toast__title">{toast.title}</div>}
                  <div>{toast.message}</div>
                </div>
                <button type="button" className="toast__close" onClick={() => dismiss(toast.id)} aria-label={t('common.close')}>
                  <X size={15} aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
