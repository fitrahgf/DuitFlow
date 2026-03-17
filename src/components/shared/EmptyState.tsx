import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
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
        'grid justify-items-center gap-2 text-center text-text-2',
        compact
          ? 'px-2 py-2.5'
          : 'min-h-[5.25rem] px-2.5 py-3 sm:min-h-[var(--empty-state-height)] sm:px-3 sm:py-3.5',
        className
      )}
    >
      {icon ? (
        <div
          className={cn(
            'grid place-items-center rounded-[calc(var(--radius-control)+0.15rem)] bg-surface-2 text-text-3',
            compact ? 'h-8 w-8' : 'h-9 w-9'
          )}
        >
          {icon}
        </div>
      ) : null}
      <div className="grid max-w-[19rem] gap-0.5">
        <p className="m-0 text-[0.98rem] font-semibold tracking-[-0.035em] text-text-1">{title}</p>
        {description ? <p className="m-0 text-[0.84rem] leading-[1.55] text-text-2">{description}</p> : null}
      </div>
      {action ? <div className="w-full pt-1 sm:w-auto">{action}</div> : null}
    </div>
  );
}

export interface EmptyStatePanelProps extends EmptyStateProps {
  panelClassName?: string;
}

export function EmptyStatePanel({
  panelClassName,
  className,
  compact = true,
  ...props
}: EmptyStatePanelProps) {
  return (
    <div
      className={cn(
        "rounded-[calc(var(--radius-card)-0.12rem)] border border-border-subtle/90 bg-surface-2/45 px-[var(--space-panel-tight)] py-[calc(var(--space-panel-tight)+0.15rem)] sm:px-[var(--space-panel)] sm:py-[calc(var(--space-panel-tight)+0.25rem)]",
        panelClassName,
      )}
    >
      <EmptyState
        {...props}
        compact={compact}
        className={cn("gap-2 px-0 py-0.5", className)}
      />
    </div>
  );
}

export interface EmptyStateWorkspaceProps extends EmptyStateProps {
  eyebrow?: ReactNode;
  meta?: ReactNode;
  supporting?: ReactNode;
  panelClassName?: string;
  supportingClassName?: string;
}

export function EmptyStateWorkspace({
  eyebrow,
  title,
  description,
  icon,
  action,
  meta,
  supporting,
  className,
  panelClassName,
  supportingClassName,
}: EmptyStateWorkspaceProps) {
  return (
    <section
      className={cn(
        "grid gap-3 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle/90 bg-surface-2/35 px-[var(--space-panel-tight)] py-[calc(var(--space-panel-tight)+0.2rem)] sm:px-[var(--space-panel)] sm:py-[calc(var(--space-panel-tight)+0.35rem)]",
        panelClassName,
      )}
    >
      <div
        className={cn(
          "grid gap-3",
          supporting &&
            "lg:grid-cols-[minmax(0,1.18fr)_minmax(14.5rem,0.82fr)] lg:items-start",
        )}
      >
        <div className={cn("grid gap-3", className)}>
          {eyebrow ? (
            <span className="text-[0.72rem] font-medium tracking-[0.08em] text-text-2">
              {eyebrow}
            </span>
          ) : null}

          <div className="flex items-start gap-3">
            {icon ? (
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[calc(var(--radius-control)+0.1rem)] bg-surface-1 text-text-3">
                {icon}
              </div>
            ) : null}

            <div className="grid max-w-[30rem] gap-1.5">
              <p className="m-0 text-[1.04rem] font-semibold tracking-[-0.045em] text-text-1">
                {title}
              </p>
              {description ? (
                <p className="m-0 text-[0.86rem] leading-[1.55] text-text-2">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {meta ? <div className="flex flex-wrap gap-2">{meta}</div> : null}
          {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
        </div>

        {supporting ? (
          <div
            className={cn(
              "grid gap-2 border-t border-border-subtle/80 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0",
              supportingClassName,
            )}
          >
            {supporting}
          </div>
        ) : null}
      </div>
    </section>
  );
}
