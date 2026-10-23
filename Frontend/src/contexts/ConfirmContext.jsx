import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/common/Modal.jsx';
import { Button } from '../components/common/Button.jsx';

const ConfirmContext = createContext(null);

/** confirm({ title, text, confirmLabel, danger }) -> Promise<boolean> */
export function ConfirmProvider({ children }) {
  const { t } = useTranslation();
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialog(options);
      }),
    []
  );

  const settle = (answer) => {
    resolver.current?.(answer);
    resolver.current = null;
    setDialog(null);
  };

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal open={Boolean(dialog)} onClose={() => settle(false)} title={dialog?.title} icon={dialog?.danger ? AlertTriangle : HelpCircle} danger={dialog?.danger}>
        {dialog?.text && <p className="modal__text">{dialog.text}</p>}
        {dialog?.content}
        <div className="modal__actions">
          <Button onClick={() => settle(false)}>{dialog?.cancelLabel ?? t('common.cancel')}</Button>
          <Button variant={dialog?.danger ? 'danger-solid' : 'primary'} onClick={() => settle(true)} data-autofocus>
            {dialog?.confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
