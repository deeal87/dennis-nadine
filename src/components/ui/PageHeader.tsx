import type { ReactNode } from 'react';

interface PageHeaderProps {
  emoji: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ emoji, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="mb-1 text-3xl" aria-hidden>
          {emoji}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
