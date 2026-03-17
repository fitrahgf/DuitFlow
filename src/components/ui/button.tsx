import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border text-center text-sm font-semibold leading-none tracking-[-0.01em] whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-soft/70',
  {
    variants: {
      variant: {
        primary: 'border-transparent bg-accent text-white shadow-xs hover:bg-accent-strong',
        secondary:
          'border-border-subtle bg-surface-1 text-text-1 hover:border-border-strong hover:bg-surface-2/88',
        ghost: 'border-transparent bg-transparent text-text-2 hover:bg-surface-2 hover:text-text-1',
        danger: 'border-transparent bg-danger text-white hover:opacity-95',
      },
      size: {
        default: 'min-h-[var(--control-height)] px-3 py-2 text-[0.82rem] sm:px-3',
        sm: 'min-h-[var(--control-height-sm)] px-2 py-1.5 text-[0.7rem] sm:px-2.5',
        icon: 'h-[var(--control-height-icon)] w-[var(--control-height-icon)] min-w-[2.5rem] p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'default',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
