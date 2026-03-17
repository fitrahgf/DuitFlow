import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      'inline-flex w-full flex-nowrap items-center gap-0.5 overflow-x-auto rounded-[var(--radius-control)] border border-border-subtle bg-surface-2/85 p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible',
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
      'inline-flex min-h-[var(--tab-height)] flex-none items-center justify-center rounded-[calc(var(--radius-control)-0.24rem)] px-2.5 py-1.25 text-[0.68rem] font-semibold text-text-3 transition hover:text-text-2 data-[state=active]:bg-surface-1 data-[state=active]:text-text-1 sm:text-[0.72rem]',
      className
    )}
    {...props}
  />
);

export const TabsContent = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('mt-2.5 outline-none', className)} {...props} />
);
