import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex min-h-[1.65rem] items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-[0.66rem] font-semibold tracking-[0.01em]',
  {
    variants: {
      variant: {
        default: 'border-border-subtle bg-surface-2 text-text-2',
        accent: 'border-accent/15 bg-accent-soft text-accent-strong',
        success: 'border-success/15 bg-success-soft text-success',
        warning: 'border-warning/20 bg-warning-soft text-warning',
        danger: 'border-danger/20 bg-danger-soft text-danger',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
