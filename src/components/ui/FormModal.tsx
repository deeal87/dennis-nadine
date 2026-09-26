import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Return false to keep the dialog open (e.g. validation failed). */
  onSubmit: () => Promise<boolean | void> | boolean | void;
  submitLabel?: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

/** Modal + <form> + footer buttons; closes after a successful submit. */
export function FormModal({ open, onClose, title, description, onSubmit, submitLabel = 'Speichern', children, size = 'lg' }: FormModalProps) {
  const formId = useId();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const result = await onSubmit();
      if (result !== false) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" form={formId} disabled={busy}>
            {busy ? 'Speichert …' : submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 pt-1">
        {children}
      </form>
    </Modal>
  );
}
