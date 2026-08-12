import { ReactNode, useEffect } from 'react';
import './Modal.css';

interface Props {
  children: ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
  transparent?: boolean;
  label?: string;
}

/**
 * Dialog used by ModalHost. Mobile stacks RN <Modal/>s pushed through
 * AppEventEmitter; on the web each one is an overlay with the same options.
 */
export const Modal = ({ children, onClose, showCloseButton = true, transparent, label }: Props) => {
  // Escape closes, and the page behind must not scroll while a modal is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="modal__backdrop"
      onClick={e => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`modal__panel ${transparent ? 'modal__panel--transparent' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {showCloseButton ? (
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
};
