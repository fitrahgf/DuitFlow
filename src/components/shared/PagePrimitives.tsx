import * as React from 'react';
import { EmptyState, type EmptyStateProps } from '@/components/shared/EmptyState';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type PageContainerSize = 'default' | 'narrow' | 'wide';
type PageContainerPadding = 'none' | 'header' | 'page';
type PageContainerAlign = 'center' | 'left' | 'responsive';
type SurfaceTone = 'default' | 'accent' | 'success' | 'warning' | 'danger';
type SurfacePadding = 'default' | 'compact' | 'none';

const pageContainerSizeClassName: Record<PageContainerSize, string> = {
  default: 'max-w-shell',
  narrow: 'max-w-4xl',
  wide: 'max-w-[72rem]',
};

const pageContainerAlignClassName: Record<PageContainerAlign, string> = {
  center: 'mx-auto',
  left: 'mx-0',
  responsive: 'mx-auto lg:mx-0',
};

const pageContainerPaddingClassName: Record<PageContainerPadding, string> = {
  none: '',
  header: 'px-3 md:px-4 lg:px-6 xl:px-7',
  page:
    'px-3 pt-2 pb-4 md:px-4 md:pb-6 lg:px-6 lg:pt-3 lg:pb-8 xl:px-7',
};

const surfaceToneClassName: Record<SurfaceTone, string> = {
  default: 'border-border-subtle/90 bg-surface-1',
  accent: 'border-accent/18 bg-surface-1',
  success: 'border-success/18 bg-surface-1',
  warning: 'border-warning/22 bg-surface-1',
  danger: 'border-danger/22 bg-surface-1',
};

const surfacePaddingClassName: Record<SurfacePadding, string> = {
  default: 'p-[var(--space-panel)] md:p-[var(--space-panel-lg)]',
  compact: 'p-3 md:p-4',
  none: 'p-0',
};

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  size?: PageContainerSize;
  padding?: PageContainerPadding;
  align?: PageContainerAlign;
  withMobileNavOffset?: boolean;
}

export function PageContainer({
  className,
  size = 'default',
  padding = 'page',
  align = 'responsive',
  withMobileNavOffset = padding === 'page',
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        pageContainerSizeClassName[size],
        pageContainerAlignClassName[align],
        pageContainerPaddingClassName[padding],
        withMobileNavOffset &&
          padding === 'page' &&
          'pb-[calc(4.75rem+var(--safe-bottom))] md:pb-6 lg:pb-8',
        className
      )}
      {...props}
    />
  );
}

export function PageShell({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-[var(--space-stack)] lg:gap-[var(--space-stack-lg)]', className)} {...props} />;
}

export function PageHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'grid gap-2 border-b border-border-subtle/70 pb-3 lg:gap-2.5 xl:flex xl:flex-row xl:items-start xl:justify-between',
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
    <div className={cn('grid max-w-[32rem] gap-1', className)}>
      {eyebrow ? (
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-text-3">
          {eyebrow}
        </span>
      ) : null}
      <h1
        className={cn(
          'm-0 text-[clamp(1.38rem,1.18rem+0.92vw,2.05rem)] font-semibold leading-[1.02] tracking-[-0.048em] text-text-1',
          titleClassName
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={cn(
            'm-0 max-w-xl text-[0.8rem] leading-5 text-text-3',
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
      ? 'grid grid-cols-2 gap-1 sm:flex sm:flex-wrap sm:items-center'
      : 'flex snap-x items-center gap-1 overflow-x-auto px-px pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0';

  return (
    <div
      className={cn(mobileClassName, className)}
      {...props}
    />
  );
}

export function SurfaceCard({
  tone = 'default',
  padding = 'default',
  interactive = false,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Card> & {
  tone?: SurfaceTone;
  padding?: SurfacePadding;
  interactive?: boolean;
}) {
  return (
    <Card
      className={cn(
        surfaceToneClassName[tone],
        surfacePaddingClassName[padding],
        interactive &&
          'transition-[border-color,background-color,box-shadow] duration-200 hover:border-border-strong hover:bg-surface-2/45',
        className
      )}
      {...props}
    />
  );
}

export function Toolbar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-1 p-[var(--space-panel)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        className
      )}
      {...props}
    />
  );
}

export interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  hideDescriptionOnMobile?: boolean;
}

export function SectionHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  titleClassName,
  hideDescriptionOnMobile = true,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="grid gap-0.5">
        {eyebrow ? (
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-text-3">
            {eyebrow}
          </span>
        ) : null}
        <h2 className={cn('m-0 text-[0.94rem] font-semibold tracking-[-0.03em] text-text-1', titleClassName)}>
          {title}
        </h2>
        {description ? (
          <p className={cn('m-0 text-[0.8rem] leading-5 text-text-3', hideDescriptionOnMobile && 'hidden sm:block')}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-1 max-sm:overflow-x-auto max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden">{actions}</div> : null}
    </div>
  );
}

export function SectionHeading(props: SectionHeaderProps) {
  return <SectionHeader {...props} />;
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

export interface StatCardProps {
  label: React.ReactNode;
  value: React.ReactNode;
  meta?: React.ReactNode;
  tone?: SurfaceTone;
  className?: string;
}

export function StatCard({
  label,
  value,
  meta,
  tone = 'default',
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'grid gap-1 rounded-[calc(var(--radius-card)-0.08rem)] p-[var(--space-panel)] shadow-none md:p-[var(--space-panel-lg)]',
        metricToneClassName[tone],
        className
      )}
    >
      <div className="inline-flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', metricIndicatorClassName[tone])} aria-hidden="true" />
        <span className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-text-3">{label}</span>
      </div>
      <strong className="text-[0.94rem] font-semibold tracking-[-0.04em] text-text-1 sm:text-[1rem]">{value}</strong>
      {meta ? <span className="text-[0.78rem] leading-5 text-text-3">{meta}</span> : null}
    </Card>
  );
}

export function MetricCard(props: StatCardProps) {
  return <StatCard {...props} />;
}

export interface EmptyStateCardProps
  extends Omit<EmptyStateProps, 'className'> {
  cardClassName?: string;
  emptyStateClassName?: string;
  tone?: SurfaceTone;
  padding?: SurfacePadding;
}

export function EmptyStateCard({
  cardClassName,
  emptyStateClassName,
  tone = 'default',
  padding = 'default',
  ...props
}: EmptyStateCardProps) {
  return (
    <SurfaceCard
      tone={tone}
      padding={padding}
      className={cardClassName}
    >
      <EmptyState {...props} className={emptyStateClassName} />
    </SurfaceCard>
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
