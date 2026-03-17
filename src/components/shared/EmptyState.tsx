import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'grid justify-items-center gap-3 text-center text-text-2',
        compact ? 'px-2 py-4' : 'px-4 py-10',
        className
      )}
    >
      {icon ? (
        <div
          className={cn(
            'grid place-items-center rounded-[calc(var(--radius-control)+0.15rem)] bg-surface-2 text-text-3',
            compact ? 'h-11 w-11' : 'h-14 w-14'
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className="grid max-w-[24rem] gap-1">
        <p className="m-0 text-sm font-semibold tracking-[-0.02em] text-text-1">{title}</p>
        {description ? <p className="m-0 text-[0.94rem] leading-6 text-text-3">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
