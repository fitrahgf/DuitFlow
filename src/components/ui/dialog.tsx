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
    className={cn('fixed inset-0 z-[120] bg-[color:var(--color-overlay)] backdrop-blur-sm', className)}
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
        'fixed left-1/2 top-1/2 z-[121] w-[calc(100%-1.5rem)] max-w-[31rem] -translate-x-1/2 -translate-y-1/2 rounded-[calc(var(--radius-sheet)-0.08rem)] border border-border-subtle bg-surface-1 p-[var(--space-panel)] shadow-sm outline-none md:p-[var(--space-panel-lg)] max-[767px]:inset-x-0 max-[767px]:bottom-0 max-[767px]:top-auto max-[767px]:w-full max-[767px]:max-w-none max-[767px]:max-h-[min(86dvh,46rem)] max-[767px]:translate-x-0 max-[767px]:translate-y-0 max-[767px]:overflow-y-auto max-[767px]:rounded-b-none max-[767px]:rounded-t-[1.55rem] max-[767px]:px-3 max-[767px]:pb-[calc(0.8rem+var(--safe-bottom))] max-[767px]:pt-2',
        className
      )}
      {...props}
    >
      {!hideClose ? (
        <DialogPrimitive.Close className="absolute right-2.5 top-2.5 inline-flex h-[var(--control-height-icon)] w-[var(--control-height-icon)] items-center justify-center rounded-[var(--radius-control)] text-text-3 transition-all duration-300 hover:bg-surface-2 hover:text-text-1">
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
  <DialogPrimitive.Title className={cn('text-[0.94rem] font-semibold tracking-[-0.03em]', className)} {...props} />
);

export const DialogDescription = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description className={cn('text-[0.8rem] leading-5 text-text-3', className)} {...props} />
);
