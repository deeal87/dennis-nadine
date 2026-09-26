import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type TagTone = 'rose' | 'violet' | 'peach' | 'mint' | 'neutral' | 'gold';

const TONES: Record<TagTone, string> = {
  rose: 'bg-rose-soft text-rose',
  violet: 'bg-violet-soft text-violet',
  peach: 'bg-peach-soft text-peach',
  mint: 'bg-mint-soft text-mint',
  gold: 'bg-peach-soft text-ink',
  neutral: 'bg-surface-2 text-muted',
};

export function Tag({ tone = 'neutral', children, className }: { tone?: TagTone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap', TONES[tone], className)}>
      {children}
    </span>
  );
}
