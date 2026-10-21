import { AlertTriangle, CheckCircle2, Info, Inbox, RefreshCw, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button.jsx';

export function Spinner({ label, className = '' }) {
  const { t } = useTranslation();
  return <span className={`spinner ${className}`} role="status" aria-label={label ?? t('common.loading')} />;
}

export function Skeleton({ width = '100%', height = 16, radius, style, className = '' }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" style={{ width, height, borderRadius: radius, ...style }} />;
}

/** Placeholder rows shown while a list is loading. */
export function ListSkeleton({ rows = 3, height = 92 }) {
  const { t } = useTranslation();
  return (
    <div className="stack" role="status" aria-label={t('common.loading')} aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} height={height} radius="16px" />
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="state">
      <div className="state__icon">
        <Icon aria-hidden="true" />
      </div>
      <div className="state__title">{title}</div>
      {text && <p className="state__text">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title }) {
  const { t } = useTranslation();
  return (
    <div className="state state--danger" role="alert">
      <div className="state__icon">
        <AlertTriangle aria-hidden="true" />
      </div>
      <div className="state__title">{title ?? t('common.errorTitle')}</div>
      <p className="state__text">{error}</p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw aria-hidden="true" /> {t('common.retry')}
        </Button>
      )}
    </div>
  );
}

const ALERT_ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle };

export function Alert({ variant = 'info', title, children, actions, className = '', role }) {
  const Icon = ALERT_ICONS[variant] ?? Info;
  return (
    <div className={`alert${variant !== 'info' ? ` alert--${variant}` : ''} ${className}`} role={role ?? (variant === 'danger' ? 'alert' : undefined)}>
      <Icon aria-hidden="true" />
      <div className="alert__body">
        {title && <div className="alert__title">{title}</div>}
        {children}
        {actions && <div className="alert__actions">{actions}</div>}
      </div>
    </div>
  );
}
