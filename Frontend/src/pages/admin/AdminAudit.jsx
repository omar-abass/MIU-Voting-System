import { useState } from 'react';
import { ScrollText, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { errorText } from '../../utils/errors.js';
import { formatDateTime, formatNumber } from '../../utils/format.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge, PageHead, Pagination } from '../../components/common/Display.jsx';
import { Alert, EmptyState, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';

const ENTITY_TYPES = ['user', 'faculty', 'club', 'event', 'competition', 'settings', 'vote'];
const PAGE_SIZE = 20;

/** Details are rendered as plain key/value text (never as HTML) and never contain secrets, ballots or OTPs. */
function DetailsText({ details }) {
  if (!details || typeof details !== 'object') return <span className="faint">–</span>;
  const pairs = Object.entries(details).slice(0, 8);
  if (!pairs.length) return <span className="faint">–</span>;
  return (
    <span className="sm muted audit-details">
      {pairs.map(([k, val]) => `${k}: ${Array.isArray(val) ? val.join(', ') : typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}`).join(' · ')}
    </span>
  );
}

export default function AdminAudit() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  useDocumentTitle(t('nav.audit'));
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [verify, setVerify] = useState({ state: 'idle', result: null, error: '' });

  const { data, loading, error, reload } = useApi(() => adminApi.auditLogs({ page, pageSize: PAGE_SIZE, entityType }), [page, entityType]);

  const runVerify = async () => {
    setVerify({ state: 'running', result: null, error: '' });
    try {
      setVerify({ state: 'done', result: await adminApi.verifyAudit(), error: '' });
    } catch (err) {
      setVerify({ state: 'error', result: null, error: errorText(t, err) });
    }
  };

  const actionLabel = (action) => t(`audit.actions.${action}`, { defaultValue: action });

  return (
    <>
      <PageHead
        title={t('audit.title')}
        subtitle={t('audit.subtitle')}
        actions={
          <Button onClick={runVerify} loading={verify.state === 'running'}>
            <ShieldCheck aria-hidden="true" /> {t('audit.verify')}
          </Button>
        }
      />
      <div aria-live="polite">
        {verify.state === 'done' && verify.result?.valid && (
          <div style={{ marginBottom: 16 }}>
            <Alert variant="success" title={t('audit.verifyOkTitle')}>
              {t('audit.verifyOk', { n: formatNumber(verify.result.checked, lang) })}
            </Alert>
          </div>
        )}
        {verify.state === 'done' && verify.result && !verify.result.valid && (
          <div style={{ marginBottom: 16 }}>
            <Alert variant="danger" title={t('audit.verifyBrokenTitle')}>
              {t('audit.verifyBroken', { id: formatNumber(verify.result.brokenAtId ?? 0, lang) })}
            </Alert>
          </div>
        )}
        {verify.state === 'error' && (
          <div style={{ marginBottom: 16 }}>
            <Alert variant="danger">{verify.error}</Alert>
          </div>
        )}
      </div>

      <div className="toolbar">
        <select
          className="select"
          value={entityType}
          onChange={(e) => {
            setEntityType(e.target.value);
            setPage(1);
          }}
          aria-label={t('audit.entity')}
        >
          <option value="">{t('audit.allEntities')}</option>
          {ENTITY_TYPES.map((x) => (
            <option key={x} value={x}>
              {t(`audit.entities.${x}`)}
            </option>
          ))}
        </select>
        <span className="faint sm">
          <ShieldAlert size={14} aria-hidden="true" style={{ display: 'inline', verticalAlign: '-2px' }} /> {t('audit.privacyNote')}
        </span>
      </div>

      {loading && !data ? (
        <ListSkeleton rows={6} height={48} />
      ) : error && !data ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState icon={ScrollText} title={t('audit.emptyTitle')} text={t('audit.emptyText')} />
        </Card>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">{t('audit.when')}</th>
                  <th scope="col">{t('audit.actor')}</th>
                  <th scope="col">{t('audit.action')}</th>
                  <th scope="col">{t('audit.entity')}</th>
                  <th scope="col">{t('audit.details')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((log) => (
                  <tr key={log.id}>
                    <td className="sm muted nowrap">{formatDateTime(log.createdAt, lang)}</td>
                    <td>
                      {log.actorUsername ? <><span className="bold">{log.actorUsername}</span>{' '}</> : null}
                      <Badge plain>{t(`roles.${log.actorRole}`, { defaultValue: log.actorRole })}</Badge>
                    </td>
                    <td>{actionLabel(log.action)}</td>
                    <td className="sm">
                      {log.entityType ? (
                        <>
                          {t(`audit.entities.${log.entityType}`, { defaultValue: log.entityType })}
                          {log.entityId ? <span className="faint ltr"> #{log.entityId}</span> : null}
                        </>
                      ) : (
                        <span className="faint">–</span>
                      )}
                    </td>
                    <td>
                      <DetailsText details={log.details} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data.meta} onPage={setPage} />
        </>
      )}
    </>
  );
}

