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
    className={cn('fixed inset-0 z-[120] bg-[color:var(--color-overlay)] backdrop-blur-md', className)}
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
        'fixed left-1/2 top-1/2 z-[121] w-[calc(100%-2rem)] max-w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-subtle bg-surface-1 p-5 shadow-md outline-none max-[767px]:inset-x-0 max-[767px]:bottom-0 max-[767px]:top-auto max-[767px]:w-full max-[767px]:max-w-none max-[767px]:translate-x-0 max-[767px]:translate-y-0 max-[767px]:rounded-b-none max-[767px]:rounded-t-[1.75rem]',
        className
      )}
      {...props}
    >
      {!hideClose ? (
        <DialogPrimitive.Close className="absolute right-3.5 top-3.5 inline-flex h-9 w-9 items-center justify-center rounded-full text-text-3 transition hover:bg-surface-2 hover:text-text-1">
          <X size={18} />
        </DialogPrimitive.Close>
      ) : null}
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
);

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid gap-1', className)} {...props} />
);

export const DialogTitle = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title className={cn('text-lg font-semibold tracking-[-0.03em]', className)} {...props} />
);

export const DialogDescription = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description className={cn('text-sm text-text-3', className)} {...props} />
);
