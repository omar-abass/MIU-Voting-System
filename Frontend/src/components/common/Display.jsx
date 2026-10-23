import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { assetUrl, BASE_PATH } from '../../utils/env.js';
import { initials } from '../../utils/format.js';
import { useCountdown } from '../../hooks/useCountdown.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatNumber } from '../../utils/format.js';

export function Badge({ variant, plain = false, children, className = '' }) {
  return <span className={['badge', variant && `badge--${variant}`, plain && 'badge--plain', className].filter(Boolean).join(' ')}>{children}</span>;
}

const STATE_VARIANT = {
  open: 'success',
  scheduled: 'info',
  closed: '',
  results_published: 'primary',
  draft: 'warning',
  cancelled: 'danger',
  published: 'success'
};

/** Lifecycle badge. `state` is the server-computed effective state. */
export function StateBadge({ state }) {
  const { t } = useTranslation();
  return <Badge variant={STATE_VARIANT[state] ?? ''}>{t(`states.${state}`, { defaultValue: state })}</Badge>;
}

export function Avatar({ user, name, src, size, className = '' }) {
  const path = src ?? user?.avatarPath;
  const label = name ?? user?.username ?? '';
  const url = assetUrl(path);
  return (
    <span className={`avatar ${className}`} style={size ? { '--size': `${size}px` } : undefined} aria-hidden="true">
      {url ? <img src={url} alt="" /> : initials(label)}
    </span>
  );
}

/** Square club/entity image with a letter fallback. */
export function LogoImage({ path, name, className }) {
  const url = assetUrl(path);
  return url ? <img src={url} alt="" /> : <span className={className}>{initials(name)}</span>;
}

const LOGO_URL = import.meta.env.VITE_LOGO_URL;

/**
 * Brand mark. The official university logo is a trademark asset that is not bundled:
 * set VITE_LOGO_URL (for example `${BASE}logos/miu-logo.png` with the file placed in public/logos/)
 * to display it. Without it, a neutral "miu" wordmark is shown.
 */
export function Logo({ light = false, to = '/', compact = false }) {
  const { t } = useTranslation();
  const inner = LOGO_URL ? (
    <img className="logo__img" src={LOGO_URL.startsWith('http') ? LOGO_URL : `${BASE_PATH}${LOGO_URL.replace(/^\//, '')}`} alt={t('app.universityName')} />
  ) : (
    <span className="logo__mark" aria-label={t('app.universityName')}>
      <b>miu</b>
      {!compact && <small>{t('app.logoCaption')}</small>}
    </span>
  );
  return (
    <Link to={to} className={`logo${light ? ' logo--light' : ''}`}>
      {inner}
    </Link>
  );
}

export function StatCard({ icon: Icon, label, value, note, tone }) {
  const { lang } = useLanguage();
  return (
    <div className="card stat" data-tone={tone}>
      {Icon && (
        <div className="stat__icon">
          <Icon aria-hidden="true" />
        </div>
      )}
      <div className="stat__label">{label}</div>
      <div className="stat__value">{typeof value === 'number' ? formatNumber(value, lang) : value}</div>
      {note && <div className="stat__note">{note}</div>}
    </div>
  );
}

export function ProgressBar({ value, max = 100, label }) {
  const pct = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="tabs" role="group" aria-label={label}>
      {tabs.map((tab) => (
        <button key={tab.value} type="button" className="tab" aria-pressed={value === tab.value} onClick={() => onChange(tab.value)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** "2d 04h 12m" style countdown, red in the last hour. Display only - the server enforces the window. */
export function Countdown({ to, prefix }) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const c = useCountdown(to);
  if (c.expired) return null;
  const n = (v) => formatNumber(v, lang);
  const text =
    c.days > 0
      ? t('countdown.dhm', { d: n(c.days), h: n(c.hours), m: n(c.minutes) })
      : c.hours > 0
        ? t('countdown.hms', { h: n(c.hours), m: n(c.minutes), s: n(c.seconds) })
        : t('countdown.ms', { m: n(c.minutes), s: n(c.seconds) });
  return (
    <span className={`countdown${c.remainingMs < 3600_000 ? ' countdown--urgent' : ''}`}>
      <Clock aria-hidden="true" />
      {prefix && <span>{prefix}</span>}
      <span className="ltr">{text}</span>
    </span>
  );
}

export function PageHead({ title, subtitle, actions, back }) {
  return (
    <>
      {back && (
        <Link to={back.to} className="back-link">
          <ChevronLeft className="flip-rtl" aria-hidden="true" /> {back.label}
        </Link>
      )}
      <div className="page-head">
        <div>
          <h1 dir="auto">{title}</h1>
          {subtitle && <p dir="auto">{subtitle}</p>}
        </div>
        {actions && <div className="page-head__actions">{actions}</div>}
      </div>
    </>
  );
}

export function Pagination({ meta, onPage }) {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  if (!meta || meta.totalPages <= 1) {
    return meta ? <div className="pagination"><span>{t('pagination.total', { n: formatNumber(meta.total, lang) })}</span></div> : null;
  }
  const { page, totalPages, total, pageSize } = meta;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const pages = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p += 1) pages.push(p);
  return (
    <nav className="pagination" aria-label={t('pagination.label')}>
      <span>{t('pagination.showing', { from: formatNumber(from, lang), to: formatNumber(to, lang), total: formatNumber(total, lang) })}</span>
      <div className="pagination__pages">
        <button type="button" className="page-btn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label={t('pagination.previous')}>
          <ChevronLeft size={16} className="flip-rtl" aria-hidden="true" />
        </button>
        {pages.map((p) => (
          <button key={p} type="button" className="page-btn" aria-current={p === page ? 'page' : undefined} onClick={() => onPage(p)}>
            {formatNumber(p, lang)}
          </button>
        ))}
        <button type="button" className="page-btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label={t('pagination.next')}>
          <ChevronRight size={16} className="flip-rtl" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
