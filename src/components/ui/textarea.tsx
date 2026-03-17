import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[6.5rem] w-full rounded-xl border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-text-1 outline-none transition-all duration-300 placeholder:text-text-3 hover:border-border-strong hover:bg-surface-2/55 focus:border-accent focus:ring-4 focus:ring-accent-soft/70 sm:min-h-[7.5rem] sm:px-4 sm:py-3',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
