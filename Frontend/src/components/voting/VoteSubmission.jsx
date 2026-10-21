import { useState } from 'react';
import { Send, ShieldQuestion } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { errorText } from '../../utils/errors.js';
import { Button } from '../common/Button.jsx';
import { Modal } from '../common/Modal.jsx';
import { Alert } from '../common/Feedback.jsx';
import { OtpVerifyPanel } from '../forms/OtpVerifyPanel.jsx';

/**
 * The shared "submit my vote" flow for events and competitions:
 *   sticky submit bar -> confirmation dialog -> SMS code dialog -> onDone(result)
 *
 * The chosen option is sent only with the final request. It is NOT attached to the OTP request,
 * and nothing is stored locally. The server re-checks eligibility and the voting window on every step.
 */
export function VoteSubmission({ selected, selectedLabel, selectedMedia, requestChallenge, cast, onDone, onFailure }) {
  const { t } = useTranslation();
  const [stage, setStage] = useState(null); // null | 'confirm' | 'otp'
  const [challenge, setChallenge] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setStage(null);
    setError('');
  };

  const sendCode = async () => {
    setBusy(true);
    setError('');
    try {
      setChallenge(await requestChallenge());
      setStage('otp');
    } catch (err) {
      setError(errorText(t, err));
      onFailure?.(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="sticky-submit">
        <Button variant="primary" size="lg" block disabled={!selected} onClick={() => setStage('confirm')}>
          <Send aria-hidden="true" className="flip-rtl" /> {t('vote.submit')}
        </Button>
        {!selected && <p className="muted sm" style={{ textAlign: 'center', marginTop: 8 }}>{t('vote.selectFirst')}</p>}
      </div>

      <Modal open={stage === 'confirm'} onClose={close} title={t('vote.confirmTitle')} icon={ShieldQuestion}>
        <p className="modal__text">{t('vote.confirmText')}</p>
        <div className="selected-summary">
          {selectedMedia}
          <div>
            <div className="faint sm bold">{t('vote.yourChoice')}</div>
            <div className="bold">{selectedLabel}</div>
          </div>
        </div>
        <p className="muted sm" style={{ marginTop: 14 }}>{t('vote.confirmFinal')}</p>
        {error && (
          <Alert variant="danger" className="" role="alert">
            {error}
          </Alert>
        )}
        <div className="modal__actions">
          <Button onClick={close} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={sendCode} loading={busy} data-autofocus>
            {t('vote.sendCode')}
          </Button>
        </div>
      </Modal>

      <Modal open={stage === 'otp' && Boolean(challenge)} onClose={close} title={t('vote.verifyTitle')} closeOnBackdrop={false}>
        {challenge && (
          <>
            <p className="modal__text">{t('vote.verifyText')}</p>
            <OtpVerifyPanel
              challenge={challenge}
              submitLabel={t('vote.castVote')}
              onSubmit={async (code) => {
                try {
                  const result = await cast({ challengeId: challenge.challengeId, code });
                  close();
                  onDone(result);
                } catch (err) {
                  // The window may have closed or the voter already voted: let the page refresh its state.
                  if (['event_closed', 'already_voted', 'event_not_found', 'club_subscription_required'].includes(err?.code)) onFailure?.(err);
                  throw err;
                }
              }}
              onResend={async () => setChallenge(await requestChallenge())}
            />
            <div className="modal__actions" style={{ marginTop: 8 }}>
              <Button variant="ghost" onClick={close}>
                {t('common.cancel')}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
