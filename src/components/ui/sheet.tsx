import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) => (
  <DialogPrimitive.Overlay
    className={cn('fixed inset-0 z-[130] bg-[color:var(--color-overlay-soft)] backdrop-blur-md', className)}
    {...props}
  />
);

const sheetVariants = cva(
  'fixed z-[131] border border-border-subtle bg-surface-1 shadow-md outline-none',
  {
    variants: {
      side: {
        right: 'inset-y-0 right-0 h-full w-full max-w-md rounded-l-[1.75rem] p-6',
        left: 'inset-y-0 left-0 h-full w-full max-w-md rounded-r-[1.75rem] p-6',
        top: 'inset-x-0 top-0 rounded-b-[1.75rem] p-6',
        bottom:
          'inset-x-0 bottom-0 mx-auto w-full max-w-[36rem] rounded-t-[1.75rem] px-4 pb-6 pt-4',
      },
    },
    defaultVariants: {
      side: 'bottom',
    },
  }
);

export const SheetContent = ({
  className,
  children,
  side,
  hideClose,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
  VariantProps<typeof sheetVariants> & { hideClose?: boolean }) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content className={cn(sheetVariants({ side }), className)} {...props}>
      {!hideClose ? (
        <DialogPrimitive.Close className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-text-3 transition hover:bg-surface-2 hover:text-text-1">
          <X size={18} />
        </DialogPrimitive.Close>
      ) : null}
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
);

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid gap-1.5', className)} {...props} />
);

export const SheetTitle = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title className={cn('text-xl font-semibold tracking-[-0.03em]', className)} {...props} />
);

export const SheetDescription = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description className={cn('text-sm text-text-3', className)} {...props} />
);
