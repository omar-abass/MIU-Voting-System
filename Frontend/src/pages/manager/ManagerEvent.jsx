import { useEffect, useState } from 'react';
import { Search, UserRoundCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { managerApi } from '../../services/endpoints.js';
import { useApi } from '../../hooks/useApi.js';
import { useConfirm } from '../../contexts/ConfirmContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';
import { errorText } from '../../utils/errors.js';
import { Button } from '../../components/common/Button.jsx';
import { Card, CardHeader } from '../../components/common/Card.jsx';
import { Alert, EmptyState, ListSkeleton } from '../../components/common/Feedback.jsx';
import { SelectField } from '../../components/forms/Fields.jsx';
import EventManage from '../shared/EventManage.jsx';

/**
 * Delegated voting: a club manager casts the vote of ONE subscriber of their club.
 * Only visible when all server-side conditions can hold (global switch on, event allows it,
 * manager granted, event open). The server re-checks every one of them when the vote is submitted.
 */
function DelegatedVotingPanel({ event, onVoted }) {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [voterId, setVoterId] = useState(null);
  const [optionId, setOptionId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const voters = useApi(() => managerApi.eligibleVoters(event.id, debounced), [event.id, debounced]);
  const list = voters.data ?? [];
  const voter = list.find((v) => v.id === voterId);

  const submit = async () => {
    if (!voter || !optionId) return;
    const option = event.options.find((o) => String(o.id) === String(optionId));
    const ok = await confirm({
      title: t('delegated.confirmTitle'),
      text: t('delegated.confirmText', { voter: voter.username, option: option?.title ?? '' }),
      confirmLabel: t('delegated.cast')
    });
    if (!ok) return;
    setBusy(true);
    setNotice('');
    try {
      const result = await managerApi.delegatedVote(event.id, { voterUserId: voter.id, optionId: Number(optionId) });
      toast.success(t('delegated.done', { voter: voter.username, id: result.receiptCode }));
      setVoterId(null);
      setOptionId('');
      voters.reload({ silent: true });
      onVoted();
    } catch (err) {
      setNotice(errorText(t, err));
      voters.reload({ silent: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ marginTop: 18 }}>
      <CardHeader title={t('delegated.title')} subtitle={t('delegated.subtitle')} />
      <Alert variant="warning">{t('delegated.warning')}</Alert>
      {voters.error ? (
        <Alert variant="danger" className="">
          {voters.error}
        </Alert>
      ) : (
        <div className="grid grid--2" style={{ marginTop: 16 }}>
          <div>
            <div className="input-icon" style={{ marginBottom: 10 }}>
              <Search aria-hidden="true" />
              <input className="input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('delegated.search')} aria-label={t('delegated.search')} />
            </div>
            {voters.loading && !voters.data ? (
              <ListSkeleton rows={3} height={44} />
            ) : list.length === 0 ? (
              <EmptyState icon={UserRoundCheck} title={t('delegated.noneTitle')} text={t('delegated.noneText')} />
            ) : (
              <div className="options" role="radiogroup" aria-label={t('delegated.voterList')} style={{ maxHeight: 320, overflowY: 'auto' }}>
                {list.map((v) => (
                  <label className="option-card" key={v.id} style={{ padding: '10px 14px' }}>
                    <input type="radio" name="voter" checked={voterId === v.id} onChange={() => setVoterId(v.id)} />
                    <span className="option-card__body">
                      <span className="option-card__title" style={{ display: 'block' }}>{v.username}</span>
                      <span className="option-card__desc ltr" style={{ display: 'block' }}>{v.studentIdMasked}</span>
                    </span>
                    <span className="option-card__radio" aria-hidden="true" />
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="form-stack">
            <SelectField label={t('delegated.option')} value={optionId} onChange={(e) => setOptionId(e.target.value)}>
              <option value="">{t('delegated.chooseOption')}</option>
              {event.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
            </SelectField>
            {notice && <Alert variant="danger">{notice}</Alert>}
            <Button variant="primary" onClick={submit} loading={busy} disabled={!voter || !optionId}>
              {t('delegated.cast')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ManagerEvent() {
  const { t } = useTranslation();
  const grants = useApi(() => managerApi.clubs(), []);
  const api = {
    get: (id) => managerApi.event(id),
    action: (id, action) => managerApi.eventAction(id, action)
  };

  return (
    <EventManage
      mode="manager"
      api={api}
      basePath="/manager/events"
      backTo="/manager"
      backLabel={t('manager.back')}
      canWrite={(ev) => Boolean(grants.data?.clubs.find((c) => c.id === ev.clubId)?.canCreateEvents)}
      extra={(ev, refresh) => {
        const grant = grants.data?.clubs.find((c) => c.id === ev.clubId);
        if (!ev.allowDelegatedVoting || ev.state !== 'open' || !grant?.canDelegateVote) return null;
        return <DelegatedVotingPanel event={ev} onVoted={refresh} />;
      }}
    />
  );
}
