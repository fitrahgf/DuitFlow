import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export const PopoverContent = ({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        'z-[150] w-72 rounded-2xl border border-border-subtle bg-surface-1 p-4 shadow-sm outline-none',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);
