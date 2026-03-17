import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      'inline-flex w-full flex-nowrap items-center gap-1 overflow-x-auto rounded-[var(--radius-control)] border border-border-subtle bg-surface-2/85 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible',
      className
    )}
    {...props}
  />
);

export const TabsTrigger = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      'inline-flex min-h-[2.75rem] flex-none items-center justify-center rounded-[calc(var(--radius-control)-0.2rem)] px-3 py-2 text-[0.72rem] font-semibold text-text-3 transition hover:text-text-2 data-[state=active]:bg-surface-1 data-[state=active]:text-text-1 data-[state=active]:shadow-xs sm:min-h-[2.45rem] sm:text-xs',
      className
    )}
    {...props}
  />
);

export const TabsContent = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('mt-4 outline-none', className)} {...props} />
);
