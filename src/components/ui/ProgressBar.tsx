import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  /** Show "value / max" and percentage. */
  showDetails?: boolean;
  className?: string;
}

export function ProgressBar({ value, max, label, showDetails = true, className }: ProgressBarProps) {
  const percent = max > 0 ? Math.round((Math.min(value, max) / max) * 100) : 0;
  return (
    <div className={cn('space-y-1.5', className)}>
      {showDetails && (
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="font-bold">
            {value} / {max} <span className="font-semibold text-muted">{label}</span>
          </span>
          <span className="font-display font-semibold text-rose">{percent} %</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(value, max)}
        className="h-3 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line ring-inset"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose via-violet to-peach transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
