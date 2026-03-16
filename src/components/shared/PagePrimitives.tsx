import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function PageShell({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-5 lg:gap-6', className)} {...props} />;
}

export function PageHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3.5 xl:flex-row xl:items-end xl:justify-between',
        className
      )}
      {...props}
    />
  );
}

export function PageHeading({
  title,
  subtitle,
  eyebrow,
  className,
  titleClassName,
  subtitleClassName,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <div className={cn('grid max-w-[40rem] gap-1.5', className)}>
      {eyebrow ? (
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-text-3">
          {eyebrow}
        </span>
      ) : null}
      <h1
        className={cn(
          'm-0 text-[clamp(1.85rem,1.42rem+1.4vw,2.8rem)] font-semibold tracking-[-0.06em] text-text-1',
          titleClassName
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className={cn('m-0 max-w-2xl text-[0.92rem] leading-5 text-text-3', subtitleClassName)}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function PageHeaderActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2.5 max-sm:flex-col max-sm:items-stretch', className)}
      {...props}
    />
  );
}

export function SurfaceCard({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Card>) {
  return <Card className={cn('p-5 md:p-6', className)} {...props} />;
}

export function Toolbar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-[calc(var(--radius-card)-0.05rem)] border border-border-subtle bg-surface-1 p-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
      {...props}
    />
  );
}

export function SectionHeading({
  title,
  description,
  eyebrow,
  actions,
  className,
  titleClassName,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="grid gap-1">
        {eyebrow ? (
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-text-3">
            {eyebrow}
          </span>
        ) : null}
        <h2 className={cn('m-0 text-[1.02rem] font-semibold tracking-[-0.03em] text-text-1', titleClassName)}>
          {title}
        </h2>
        {description ? <p className="m-0 text-[0.92rem] leading-5 text-text-3">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

const metricToneClassName: Record<
  'default' | 'accent' | 'success' | 'warning' | 'danger',
  string
> = {
  default: 'border-border-subtle bg-surface-1',
  accent: 'border-accent/18 bg-surface-1',
  success: 'border-success/18 bg-surface-1',
  warning: 'border-warning/22 bg-surface-1',
  danger: 'border-danger/22 bg-surface-1',
};

const metricIndicatorClassName: Record<
  'default' | 'accent' | 'success' | 'warning' | 'danger',
  string
> = {
  default: 'bg-text-3/40',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function MetricCard({
  label,
  value,
  meta,
  tone = 'default',
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  meta?: React.ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
}) {
  return (
    <Card className={cn('grid gap-2.5 rounded-[calc(var(--radius-card)-0.1rem)] p-4 shadow-none', metricToneClassName[tone], className)}>
      <div className="inline-flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', metricIndicatorClassName[tone])} aria-hidden="true" />
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-3">{label}</span>
      </div>
      <strong className="text-lg font-semibold tracking-[-0.04em] text-text-1">{value}</strong>
      {meta ? <span className="text-sm text-text-3">{meta}</span> : null}
    </Card>
  );
}

const progressToneClassName: Record<'default' | 'accent' | 'success' | 'warning' | 'danger', string> = {
  default: 'bg-text-3/35',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
};

export function ProgressMeter({
  value,
  tone = 'accent',
  className,
  indicatorClassName,
  ariaLabel,
}: {
  value: number;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
  indicatorClassName?: string;
  ariaLabel?: string;
}) {
  const clampedValue = Math.max(0, Math.min(value, 1));
  const percent = Math.round(clampedValue * 100);

  return (
    <div
      className={cn('h-2 overflow-hidden rounded-full bg-surface-3/90', className)}
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300 ease-out',
          progressToneClassName[tone],
          indicatorClassName
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
