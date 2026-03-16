import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[7.5rem] w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-1 outline-none transition placeholder:text-text-3 hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent-soft/70',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export { Textarea };
