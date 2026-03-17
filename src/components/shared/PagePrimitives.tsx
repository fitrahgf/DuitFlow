import * as React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function PageShell({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-3 md:gap-4 lg:gap-5', className)} {...props} />;
}

export function PageHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'grid gap-2 lg:gap-2.5 xl:flex xl:flex-row xl:items-end xl:justify-between',
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
  hideSubtitleOnMobile = true,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  hideSubtitleOnMobile?: boolean;
}) {
  return (
    <div className={cn('grid max-w-[38rem] gap-1', className)}>
      {eyebrow ? (
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-text-3">
          {eyebrow}
        </span>
      ) : null}
      <h1
        className={cn(
          'm-0 text-[clamp(1.55rem,1.28rem+1.15vw,2.7rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-text-1',
          titleClassName
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={cn(
            'm-0 max-w-2xl text-[0.88rem] leading-5 text-text-3',
            hideSubtitleOnMobile && 'hidden sm:block',
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

export function PageHeaderActions({
  className,
  mobileLayout = 'scroll',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { mobileLayout?: 'scroll' | 'grid' }) {
  const mobileClassName =
    mobileLayout === 'grid'
      ? 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center'
      : 'flex snap-x items-center gap-2 overflow-x-auto px-px pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0';

  return (
    <div
      className={cn(mobileClassName, className)}
      {...props}
    />
  );
}

export function SurfaceCard({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Card>) {
  return <Card className={cn('p-3 md:p-4', className)} {...props} />;
}

export function Toolbar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-1/90 p-2.5 sm:flex-row sm:items-center sm:justify-between',
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
  hideDescriptionOnMobile = true,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  hideDescriptionOnMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="grid gap-1">
        {eyebrow ? (
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-text-3">
            {eyebrow}
          </span>
        ) : null}
        <h2 className={cn('m-0 text-[1.02rem] font-semibold tracking-[-0.04em] text-text-1', titleClassName)}>
          {title}
        </h2>
        {description ? (
          <p className={cn('m-0 text-[0.88rem] leading-5 text-text-3', hideDescriptionOnMobile && 'hidden sm:block')}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 max-sm:overflow-x-auto max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden">{actions}</div> : null}
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
    <Card className={cn('grid gap-2 rounded-[calc(var(--radius-card)-0.08rem)] p-3 shadow-none md:p-4', metricToneClassName[tone], className)}>
      <div className="inline-flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', metricIndicatorClassName[tone])} aria-hidden="true" />
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-3">{label}</span>
      </div>
      <strong className="text-[1rem] font-semibold tracking-[-0.04em] text-text-1 sm:text-[1.08rem]">{value}</strong>
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
