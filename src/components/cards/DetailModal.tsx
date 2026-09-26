import type { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SmartImage } from '../ui/SmartImage';

interface DetailModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  image?: string;
  fallbackEmoji: string;
  /** Hide the image area entirely (e.g. when a media preview replaces it). */
  hideImage?: boolean;
  badges?: ReactNode;
  children?: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  extraActions?: ReactNode;
}

export function DetailModal({ open, onClose, title, subtitle, image, fallbackEmoji, hideImage, badges, children, onEdit, onDelete, extraActions }: DetailModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      hideTitle
      footer={
        <>
          <Button variant="danger" icon={Trash2} onClick={onDelete} className="mr-auto">
            Löschen
          </Button>
          {extraActions}
          <Button variant="secondary" icon={Pencil} onClick={onEdit}>
            Bearbeiten
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {!hideImage && <SmartImage src={image} alt={title} aspect="aspect-[16/9]" fallbackEmoji={fallbackEmoji} className="rounded-3xl" eager />}
        <div>
          {badges && <div className="mb-2 flex flex-wrap gap-1.5">{badges}</div>}
          <p className="font-display text-2xl font-semibold sm:text-3xl" aria-hidden>
            {title}
          </p>
          {subtitle && <div className="mt-1 text-muted">{subtitle}</div>}
        </div>
        {children}
      </div>
    </Modal>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted">{title}</h3>
      <div className="leading-relaxed">{children}</div>
    </section>
  );
}

/** Definition list for small facts (Episoden, Datum, Preis …). */
export function FactList({ facts }: { facts: Array<[label: string, value: ReactNode | undefined]> }) {
  const visible = facts.filter(([, value]) => value !== undefined && value !== '' && value !== null);
  if (visible.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {visible.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-surface-2 px-3 py-2">
          <dt className="text-xs font-bold text-muted">{label}</dt>
          <dd className="font-bold">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
