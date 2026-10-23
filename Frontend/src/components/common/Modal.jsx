import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Accessible modal: focus is trapped, Escape closes, focus returns to the trigger, page scroll is locked. */
export function Modal({ open, onClose, title, children, icon: Icon, danger = false, wide = false, closeOnBackdrop = true, labelledBy }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);
  // Callers pass a fresh onClose on every render. Reading it through a ref keeps the effect below tied to
  // `open` only, otherwise every keystroke in a form inside the modal would re-run it and pull focus away.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    previouslyFocused.current = document.activeElement;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => {
      // A field inside the dialog may already have taken focus itself (e.g. the SMS code boxes): leave it alone.
      if (panelRef.current?.contains(document.activeElement)) return;
      const first = panelRef.current?.querySelector('[data-autofocus]') ?? panelRef.current?.querySelector(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    }, 30);

    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)];
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = original;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => {
            if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            ref={panelRef}
            className={`modal${wide ? ' modal--wide' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy ?? titleId}
            tabIndex={-1}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {Icon && (
              <div className={`modal__icon${danger ? ' modal__icon--danger' : ''}`}>
                <Icon aria-hidden="true" />
              </div>
            )}
            {title && (
              <h2 className="modal__title" id={titleId}>
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
