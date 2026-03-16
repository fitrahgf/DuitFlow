import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex min-h-[3rem] w-full rounded-[var(--radius-control)] border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-1 outline-none transition placeholder:text-text-3 hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent-soft/70',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
