import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export const DialogOverlay = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-[120] bg-[color:var(--color-overlay)]/95 backdrop-blur-[6px]',
      className
    )}
    {...props}
  />
);

export const DialogContent = ({
  className,
  children,
  hideClose,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideClose?: boolean }) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      className={cn(
        'fixed left-1/2 top-1/2 z-[121] w-[calc(100%-1rem)] max-w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-sheet)] border border-border-subtle bg-surface-1 p-[var(--space-panel-tight)] shadow-[0_24px_70px_-28px_rgba(15,23,42,0.38)] outline-none md:p-[var(--space-panel)] max-[767px]:inset-x-0 max-[767px]:bottom-0 max-[767px]:top-auto max-[767px]:w-full max-[767px]:max-w-none max-[767px]:max-h-[min(85dvh,44rem)] max-[767px]:translate-x-0 max-[767px]:translate-y-0 max-[767px]:overflow-y-auto max-[767px]:rounded-b-none max-[767px]:rounded-t-[var(--radius-sheet)] max-[767px]:px-[var(--page-gutter)] max-[767px]:pb-[calc(var(--page-bottom-space)-0.25rem+var(--safe-bottom))] max-[767px]:pt-2.5',
        className
      )}
      {...props}
    >
      {!hideClose ? (
        <DialogPrimitive.Close className="absolute right-2 top-2 inline-flex h-[calc(var(--control-height-icon)-0.1rem)] w-[calc(var(--control-height-icon)-0.1rem)] items-center justify-center rounded-[var(--radius-control)] text-text-3 transition-[background-color,color,box-shadow] duration-200 hover:bg-surface-2 hover:text-text-1 hover:shadow-xs">
          <X size={18} />
        </DialogPrimitive.Close>
      ) : null}
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
);

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid gap-0.5', className)} {...props} />
);

export const DialogTitle = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title
    className={cn('text-[0.96rem] font-semibold tracking-[-0.04em] text-text-1', className)}
    {...props}
  />
);

export const DialogDescription = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description
    className={cn('text-[0.78rem] leading-5 text-text-3', className)}
    {...props}
  />
);
