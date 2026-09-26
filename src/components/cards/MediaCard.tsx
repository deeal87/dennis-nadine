import type { ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { SmartImage } from '../ui/SmartImage';
import { IconButton } from '../ui/Button';

interface MediaCardProps {
  title: string;
  onOpen: () => void;
  image?: string;
  fallbackEmoji: string;
  aspect?: string;
  /** Overlay badges on the image. */
  badges?: ReactNode;
  /** Top-right overlay on the image (e.g. favourite toggle). */
  corner?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  muted?: boolean;
  className?: string;
}

/**
 * Base card for all collections. The title is a stretched button that opens
 * the detail view; nested controls sit above it (relative z-10).
 */
export function MediaCard({ title, onOpen, image, fallbackEmoji, aspect, badges, corner, children, footer, muted, className }: MediaCardProps) {
  return (
    <article
      className={cn(
        'card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] focus-within:shadow-[var(--shadow-lift)]',
        muted && 'opacity-75',
        className,
      )}
    >
      <div className="relative">
        <SmartImage src={image} alt={title} aspect={aspect} fallbackEmoji={fallbackEmoji} className="transition duration-500 group-hover:scale-[1.03]" />
        {badges && <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">{badges}</div>}
        {corner && <div className="absolute right-2 top-2 z-10">{corner}</div>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-semibold leading-snug">
          <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {title}
          </button>
        </h3>
        {children && <div className="flex flex-col gap-2 text-sm text-muted">{children}</div>}
        {footer && <div className="relative z-10 mt-auto flex flex-wrap items-center gap-2 pt-2">{footer}</div>}
      </div>
    </article>
  );
}

/** Round overlay button for use in `corner`. */
export function CornerToggle({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'grid size-11 place-items-center rounded-full text-lg shadow-[var(--shadow-soft)] backdrop-blur transition hover:scale-110 active:scale-95',
        active ? 'bg-surface' : 'bg-surface/70 grayscale',
      )}
    >
      {children}
    </button>
  );
}

export function EditDeleteActions({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="ml-auto flex">
      <IconButton icon={Pencil} label={`${label} bearbeiten`} onClick={onEdit} />
      <IconButton icon={Trash2} label={`${label} löschen`} onClick={onDelete} className="hover:!bg-danger-soft hover:!text-danger" />
    </div>
  );
}

/** Responsive card grid used by all collection pages. */
export function CardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn('grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3', className)}>{children}</ul>;
}
