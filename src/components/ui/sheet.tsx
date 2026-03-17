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
        right: 'inset-y-0 right-0 h-full w-full max-w-md overflow-y-auto rounded-l-[1.75rem] p-5',
        left: 'inset-y-0 left-0 h-full w-full max-w-md overflow-y-auto rounded-r-[1.75rem] p-5',
        top: 'inset-x-0 top-0 overflow-y-auto rounded-b-[1.75rem] p-5',
        bottom:
          'inset-x-0 bottom-0 mx-auto w-full max-w-[36rem] max-h-[min(90dvh,48rem)] overflow-y-auto rounded-t-[1.75rem] px-4 pb-[calc(1rem+var(--safe-bottom))] pt-3',
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
        <DialogPrimitive.Close className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-text-3 transition-all duration-300 hover:bg-surface-2 hover:text-text-1">
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
  <DialogPrimitive.Title className={cn('text-lg font-semibold tracking-[-0.03em]', className)} {...props} />
);

export const SheetDescription = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description className={cn('text-sm text-text-3', className)} {...props} />
);
