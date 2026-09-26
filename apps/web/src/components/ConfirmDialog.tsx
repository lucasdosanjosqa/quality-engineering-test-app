import { useEffect, useRef, type ReactNode } from 'react';

import styles from '../App.module.css';

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (element !== null) {
      if (typeof element.showModal === 'function') element.showModal();
      else element.setAttribute('open', '');
    }
    cancelButton.current?.focus();
    return () => {
      if (element?.open === true && typeof element.close === 'function') {
        element.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.modal}
      aria-labelledby="confirmation-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <h2 id="confirmation-title">{title}</h2>
      {children}
      <div className={styles.actions}>
        <button ref={cancelButton} type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={styles.dangerButton}
          type="button"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
