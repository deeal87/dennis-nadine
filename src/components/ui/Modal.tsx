import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' } as const;

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  /** Visually hide the title (still announced). */
  hideTitle?: boolean;
}

/**
 * Accessible modal built on the native <dialog> element: focus trapping,
 * Escape handling and top-layer rendering come from the browser.
 * On small screens it becomes a bottom sheet.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', hideTitle }: ModalProps) {
  if (!open) return null;
  return (
    <ModalDialog onClose={onClose} title={title} description={description} footer={footer} size={size} hideTitle={hideTitle}>
      {children}
    </ModalDialog>
  );
}

function ModalDialog({ onClose, title, description, children, footer, size = 'md', hideTitle }: Omit<ModalProps, 'open'>) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        'm-0 mt-auto max-h-[92dvh] w-full max-w-full overflow-hidden rounded-t-[1.75rem] border border-line bg-surface p-0 text-ink shadow-[var(--shadow-lift)]',
        'sm:m-auto sm:w-[calc(100%-2rem)] sm:rounded-[1.75rem] animate-pop',
        SIZES[size],
      )}
    >
      <div className="flex max-h-[92dvh] flex-col">
        <header className={cn('flex items-start gap-3 px-5 pt-5 sm:px-6', hideTitle ? 'justify-end' : 'justify-between pb-3')}>
          <div className={cn('min-w-0', hideTitle && 'sr-only')}>
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton icon={X} label="Schließen" onClick={onClose} className="-mr-2 -mt-1 shrink-0" />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-surface-2/60 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
