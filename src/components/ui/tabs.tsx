import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      'inline-flex w-full flex-nowrap items-center gap-1 overflow-x-auto rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-2/85 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible',
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
      'inline-flex min-h-[var(--tab-height)] flex-none items-center justify-center rounded-[calc(var(--radius-control)-0.08rem)] px-3 py-1.5 text-[0.76rem] font-medium text-text-2 transition-[background-color,color,box-shadow] hover:text-text-1 data-[state=active]:bg-surface-1 data-[state=active]:font-semibold data-[state=active]:text-text-1 data-[state=active]:shadow-xs',
      className
    )}
    {...props}
  />
);

export const TabsContent = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content className={cn('mt-3 outline-none', className)} {...props} />
);
