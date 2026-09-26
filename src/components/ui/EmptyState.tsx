import type { ReactNode } from 'react';

interface EmptyStateProps {
  emoji: string;
  title: string;
  text?: string;
  action?: ReactNode;
}

export function EmptyState({ emoji, title, text, action }: EmptyStateProps) {
  return (
    <div className="card pattern-waves relative flex flex-col items-center gap-3 overflow-hidden px-6 py-12 text-center animate-fade-up">
      <span className="text-5xl animate-float motion-safe:inline-block" aria-hidden>
        {emoji}
      </span>
      <h3 className="text-xl font-semibold">{title}</h3>
      {text && <p className="max-w-sm text-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
