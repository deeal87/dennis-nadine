import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { createId } from '@/lib/id';

export type ToastTone = 'success' | 'info' | 'error';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  action?: { label: string; onClick: () => void };
  /** Milliseconds; defaults to 4s, 7s when an action is present. */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

const ICONS = { success: CircleCheck, info: Info, error: TriangleAlert } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = createId();
      setToasts((all) => [...all.slice(-2), { ...options, id }]);
      const duration = options.duration ?? (options.action ? 7000 : 4000);
      timers.current.set(id, window.setTimeout(() => dismiss(id), duration));
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {toasts.map((toast) => {
          const Icon = ICONS[toast.tone ?? 'success'];
          return (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className="glass pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl py-2 pl-4 pr-2 shadow-[var(--shadow-lift)] [animation:toast-in_.3s_ease-out_both]"
            >
              <Icon
                className={cn('size-5 shrink-0', toast.tone === 'error' ? 'text-danger' : toast.tone === 'info' ? 'text-violet' : 'text-mint')}
                aria-hidden
              />
              <p className="min-w-0 flex-1 py-1.5 text-sm font-semibold">{toast.message}</p>
              {toast.action && (
                <button
                  type="button"
                  className="min-h-10 rounded-full px-3 text-sm font-extrabold text-rose hover:bg-rose-soft"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                >
                  {toast.action.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Hinweis schließen"
                className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2"
                onClick={() => dismiss(toast.id)}
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): (options: ToastOptions) => void {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
