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
    className={cn('fixed inset-0 z-[130] bg-[color:var(--color-overlay-soft)] backdrop-blur-sm', className)}
    {...props}
  />
);

const sheetVariants = cva(
  'fixed z-[131] border border-border-subtle bg-surface-1 shadow-sm outline-none',
  {
    variants: {
      side: {
        right: 'inset-y-0 right-0 h-full w-full max-w-md overflow-y-auto rounded-l-[var(--radius-sheet)] p-[var(--space-panel-lg)]',
        left: 'inset-y-0 left-0 h-full w-full max-w-md overflow-y-auto rounded-r-[var(--radius-sheet)] p-[var(--space-panel-lg)]',
        top: 'inset-x-0 top-0 overflow-y-auto rounded-b-[var(--radius-sheet)] p-[var(--space-panel-lg)]',
        bottom:
          'inset-x-0 bottom-0 mx-auto w-full max-w-[33rem] max-h-[min(88dvh,46rem)] overflow-y-auto rounded-t-[var(--radius-sheet)] px-[var(--page-gutter)] pb-[calc(var(--page-bottom-space)+var(--safe-bottom))] pt-2',
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
        <DialogPrimitive.Close className="absolute right-2.5 top-2.5 inline-flex h-[var(--control-height-icon)] w-[var(--control-height-icon)] items-center justify-center rounded-[var(--radius-control)] text-text-3 transition-[background-color,color] duration-200 hover:bg-surface-2 hover:text-text-1">
          <X size={18} />
        </DialogPrimitive.Close>
      ) : null}
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
);

export const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grid gap-1', className)} {...props} />
);

export const SheetTitle = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) => (
  <DialogPrimitive.Title className={cn('text-[0.98rem] font-semibold tracking-[-0.04em]', className)} {...props} />
);

export const SheetDescription = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) => (
  <DialogPrimitive.Description className={cn('text-[0.8rem] leading-5 text-text-3', className)} {...props} />
);
