import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { cn } from '@/lib/utils';

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal = AlertDialogPrimitive.Portal;
export const AlertDialogAction = AlertDialogPrimitive.Action;
export const AlertDialogCancel = AlertDialogPrimitive.Cancel;

export const AlertDialogOverlay = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>) => (
  <AlertDialogPrimitive.Overlay
    className={cn('fixed inset-0 z-[140] bg-[color:var(--color-overlay)] backdrop-blur-md', className)}
    {...props}
  />
);

export const AlertDialogContent = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      className={cn(
        'fixed left-1/2 top-1/2 z-[141] w-[calc(100%-1.25rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-sheet)] border border-border-subtle bg-surface-1 p-[var(--space-panel-lg)] shadow-sm outline-none',
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
);

export const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid gap-1', className)} {...props} />
);

export const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-5 grid grid-cols-2 gap-2.5 max-sm:grid-cols-1', className)} {...props} />
);

export const AlertDialogTitle = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>) => (
  <AlertDialogPrimitive.Title className={cn('text-[0.98rem] font-semibold tracking-[-0.04em]', className)} {...props} />
);

export const AlertDialogDescription = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>) => (
  <AlertDialogPrimitive.Description className={cn('text-[0.82rem] leading-5 text-text-3', className)} {...props} />
);
