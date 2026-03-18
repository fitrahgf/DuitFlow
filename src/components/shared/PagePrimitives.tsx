import * as React from 'react';
import { EmptyState, type EmptyStateProps } from '@/components/shared/EmptyState';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type PageContainerSize = 'default' | 'narrow' | 'wide';
type PageContainerPadding = 'none' | 'header' | 'page';
type PageContainerAlign = 'center' | 'left' | 'responsive';
type SurfaceTone = 'default' | 'accent' | 'success' | 'warning' | 'danger';
type SurfacePadding = 'default' | 'compact' | 'none';
type SurfaceRole = 'default' | 'featured' | 'embedded' | 'ghost';
type PageHeaderVariant = 'default' | 'compact' | 'plain';

const pageContainerSizeClassName: Record<PageContainerSize, string> = {
  default: 'max-w-shell',
  narrow: 'max-w-5xl',
  wide: 'max-w-[82rem]',
};

const pageContainerAlignClassName: Record<PageContainerAlign, string> = {
  center: 'mx-auto',
  left: 'mx-0',
  responsive: 'mx-auto',
};

const pageContainerPaddingClassName: Record<PageContainerPadding, string> = {
  none: '',
  header: 'px-[var(--page-gutter)]',
  page:
    'px-[var(--page-gutter)] pt-[var(--page-top-space)] pb-[var(--page-bottom-space)]',
};

const surfaceToneClassName: Record<SurfaceTone, string> = {
  default: 'border-border-subtle/90 bg-surface-1',
  accent: 'border-accent/18 bg-surface-1',
  success: 'border-success/18 bg-surface-1',
  warning: 'border-warning/22 bg-surface-1',
  danger: 'border-danger/22 bg-surface-1',
};

const surfacePaddingClassName: Record<SurfacePadding, string> = {
  default: 'p-[var(--space-panel)] lg:p-[var(--space-panel-lg)]',
  compact: 'p-[var(--space-panel-tight)] lg:p-[var(--space-panel)]',
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
          'pb-[calc(5rem+var(--page-bottom-space)+var(--safe-bottom))] md:pb-[calc(var(--page-bottom-space)+0.5rem)] lg:pb-[calc(var(--page-bottom-space)+0.75rem)]',
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
  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-[var(--page-section-gap)] xl:gap-[var(--page-section-gap-lg)]',
        className
      )}
      {...props}
    />
  );
}

export function PageHeader({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: PageHeaderVariant }) {
  const variantClassName =
    variant === 'compact'
      ? 'gap-2.5 border-b border-border-subtle/70 pb-3 xl:items-center'
      : variant === 'plain'
        ? 'gap-2 border-b-0 pb-0 xl:items-center'
        : 'gap-[var(--page-header-gap)] border-b border-border-subtle/80 pb-[var(--page-header-padding-bottom)] xl:items-end';

  return (
    <div
      className={cn(
        'grid xl:grid-cols-[minmax(0,1fr)_auto]',
        variantClassName,
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
  compact = false,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  hideSubtitleOnMobile?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn('grid max-w-[36rem]', compact ? 'gap-1' : 'gap-1.5', className)}>
      {eyebrow ? (
        <span className="text-[0.72rem] font-medium tracking-[0.08em] text-text-2">
          {eyebrow}
        </span>
      ) : null}
      <h1
        className={cn(
          compact
            ? 'm-0 text-[clamp(1.24rem,1.02rem+0.8vw,1.76rem)] font-semibold leading-[1.05] tracking-[-0.045em] text-text-1'
            : 'm-0 text-[clamp(1.36rem,1.12rem+0.92vw,2.06rem)] font-semibold leading-[1.04] tracking-[-0.052em] text-text-1',
          titleClassName
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={cn(
            compact
              ? 'm-0 max-w-[38rem] text-[0.82rem] leading-[1.55] text-text-2'
              : 'm-0 max-w-[42rem] text-[0.88rem] leading-[1.58] text-text-2',
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
      ? 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end'
      : 'flex snap-x items-center gap-2 overflow-x-auto px-px pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-end sm:overflow-visible sm:px-0 sm:pb-0 [&>*]:shrink-0';

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
  role = 'default',
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Card> & {
  tone?: SurfaceTone;
  padding?: SurfacePadding;
  interactive?: boolean;
  role?: SurfaceRole;
}) {
  const roleClassName =
    role === 'featured'
      ? 'surface-featured border-border-strong/28 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_94%,transparent),color-mix(in_srgb,var(--surface-accent)_68%,transparent))] backdrop-blur-[14px]'
      : role === 'embedded'
        ? 'border-border-subtle/72 bg-surface-2/68 shadow-none backdrop-blur-[10px]'
        : role === 'ghost'
          ? 'border-transparent bg-transparent shadow-none'
          : 'bg-surface-1/88 shadow-xs backdrop-blur-[10px]';

  return (
    <Card
      className={cn(
        surfaceToneClassName[tone],
        surfacePaddingClassName[padding],
        'rounded-[var(--radius-card)]',
        roleClassName,
        interactive &&
          'transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-[1px] hover:border-border-strong hover:bg-surface-2/74 hover:shadow-sm',
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
        'flex flex-col gap-2 rounded-[var(--radius-card)] border border-border-subtle bg-surface-1 p-[var(--space-panel)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between',
        'backdrop-blur-[10px]',
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
        'flex flex-col gap-2 sm:min-h-[var(--panel-header-min-height)] sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="grid gap-0.5">
        {eyebrow ? (
          <span className="text-[0.72rem] font-medium tracking-[0.08em] text-text-2">
            {eyebrow}
          </span>
        ) : null}
        <h2
          className={cn(
            'm-0 text-[1rem] font-semibold tracking-[-0.04em] text-text-1',
            titleClassName
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              'm-0 text-[0.84rem] leading-[1.55] text-text-2',
              hideDescriptionOnMobile && 'hidden sm:block'
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 max-sm:overflow-x-auto max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

export function SectionHeading(props: SectionHeaderProps) {
  return <SectionHeader {...props} />;
}

export function PanelHeader(props: SectionHeaderProps) {
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
        'grid min-h-[5.2rem] gap-1.5 rounded-[calc(var(--radius-card)-0.08rem)] p-[var(--space-panel)] shadow-none lg:p-[var(--space-panel-lg)]',
        'backdrop-blur-[8px]',
        metricToneClassName[tone],
        className
      )}
    >
      <div className="inline-flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', metricIndicatorClassName[tone])} aria-hidden="true" />
        <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">{label}</span>
      </div>
      <strong className="text-[1rem] font-semibold tracking-[-0.05em] text-text-1 sm:text-[1.08rem]">
        {value}
      </strong>
      {meta ? <span className="text-[0.79rem] leading-5 text-text-2">{meta}</span> : null}
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
  role?: SurfaceRole;
  variant?: 'inline' | 'section' | 'featured';
}

export function EmptyStateCard({
  cardClassName,
  emptyStateClassName,
  tone = 'default',
  padding = 'default',
  role = 'default',
  variant = 'section',
  ...props
}: EmptyStateCardProps) {
  return (
    <SurfaceCard
      tone={tone}
      padding={padding}
      role={role}
      className={cardClassName}
    >
      <EmptyState {...props} variant={variant} className={emptyStateClassName} />
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
