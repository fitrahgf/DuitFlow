import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border text-center text-sm font-semibold leading-none tracking-[-0.01em] whitespace-nowrap transition-all duration-300 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-soft/70 active:scale-[0.985]',
  {
    variants: {
      variant: {
        primary: 'border-transparent bg-accent text-white shadow-sm hover:-translate-y-px hover:bg-accent-strong hover:shadow-md',
        secondary:
          'border-border-subtle bg-surface-1 text-text-1 shadow-[inset_0_1px_0_hsla(0,0%,100%,0.28)] hover:-translate-y-px hover:border-border-strong hover:bg-surface-2 hover:shadow-sm',
        ghost: 'border-transparent bg-transparent text-text-2 hover:bg-surface-2 hover:text-text-1',
        danger: 'border-transparent bg-danger text-white hover:opacity-95',
      },
      size: {
        default: 'min-h-[2.75rem] px-3.5 py-2.5 sm:min-h-[2.8rem] sm:px-4',
        sm: 'min-h-[2.45rem] px-2.75 py-2 text-[0.74rem] sm:min-h-[2.5rem] sm:px-3',
        icon: 'h-11 w-11 min-w-[2.75rem] p-0',
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
