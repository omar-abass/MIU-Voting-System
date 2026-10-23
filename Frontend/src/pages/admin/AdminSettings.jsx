import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../contexts/ToastContext.jsx';
import { errorText } from '../../utils/errors.js';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { PageHead } from '../../components/common/Display.jsx';
import { Alert, ErrorState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { SwitchField } from '../../components/forms/Fields.jsx';

export default function AdminSettings() {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  useDocumentTitle(t('nav.systemSettings'));
  const { data, loading, error, reload, setData } = useApi(() => adminApi.settings(), []);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const toggleDelegated = async (next) => {
    const ok = await confirm({
      title: next ? t('admin.settings.enableTitle') : t('admin.settings.disableTitle'),
      text: next ? t('admin.settings.enableText') : t('admin.settings.disableText'),
      confirmLabel: next ? t('admin.settings.enable') : t('admin.settings.disable'),
      danger: next
    });
    if (!ok) return;
    setBusy(true);
    setNotice('');
    try {
      setData(await adminApi.updateSettings({ delegatedVotingEnabled: next }));
      toast.success(next ? t('admin.settings.enabledDone') : t('admin.settings.disabledDone'));
    } catch (err) {
      setNotice(errorText(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title={t('admin.settings.title')} subtitle={t('admin.settings.subtitle')} />
      {loading && !data ? (
        <ListSkeleton rows={1} height={160} />
      ) : error && !data ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : (
        <Card>
          <CardHeader title={t('admin.settings.delegatedTitle')} />
          <p className="muted" style={{ marginBottom: 16 }}>
            {t('admin.settings.delegatedText')}
          </p>
          {notice && (
            <div style={{ marginBottom: 14 }}>
              <Alert variant="danger">{notice}</Alert>
            </div>
          )}
          <SwitchField
            label={t('admin.settings.delegatedSwitch')}
            description={data.delegatedVotingEnabled ? t('admin.settings.stateOn') : t('admin.settings.stateOff')}
            checked={Boolean(data.delegatedVotingEnabled)}
            disabled={busy}
            onChange={toggleDelegated}
          />
          <Alert variant="warning" title={t('admin.settings.warningTitle')} className="mt-16">
            {t('admin.settings.warningText')}
          </Alert>
        </Card>
      )}
    </>
  );
}

