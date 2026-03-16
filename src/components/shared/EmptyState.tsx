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
        'grid justify-items-center gap-2.5 text-center text-text-2',
        compact ? 'px-2 py-3' : 'px-4 py-8',
        className
      )}
    >
      {icon ? (
        <div
          className={cn(
            'grid place-items-center rounded-[calc(var(--radius-control)+0.15rem)] bg-surface-2 text-text-3',
            compact ? 'h-10 w-10' : 'h-12 w-12'
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className="grid max-w-[24rem] gap-0.5">
        <p className="m-0 text-sm font-semibold text-text-1">{title}</p>
        {description ? <p className="m-0 text-[0.92rem] leading-5 text-text-3">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
