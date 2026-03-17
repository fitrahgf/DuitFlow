import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[4.85rem] w-full rounded-xl border border-border-subtle bg-surface-1 px-3 py-2 text-sm text-text-1 outline-none transition-all duration-200 placeholder:text-text-3 hover:border-border-strong hover:bg-surface-2/55 focus:border-accent focus:ring-4 focus:ring-accent-soft/70 sm:min-h-[5.5rem] sm:px-3.5',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
