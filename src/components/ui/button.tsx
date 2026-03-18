import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-control)] border text-center text-sm font-semibold leading-none tracking-[-0.01em] whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-soft/75 active:scale-[0.99]',
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-accent text-white shadow-xs hover:bg-accent-strong hover:shadow-sm',
        secondary:
          'border-border-subtle bg-surface-1/92 text-text-1 shadow-none hover:border-border-strong hover:bg-surface-2/92',
        ghost:
          'border-transparent bg-transparent text-text-2 shadow-none hover:bg-surface-2/88 hover:text-text-1',
        danger: 'border-transparent bg-danger text-white shadow-xs hover:opacity-95',
      },
      size: {
        default: 'min-h-[var(--control-height)] px-3.5 py-2 text-[0.82rem]',
        sm: 'min-h-[var(--control-height-sm)] px-3 py-1.5 text-[0.75rem]',
        icon: 'h-[var(--control-height-icon)] w-[var(--control-height-icon)] min-w-[var(--control-height-icon)] p-0',
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
