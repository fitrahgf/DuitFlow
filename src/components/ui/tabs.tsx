import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn('inline-flex rounded-[var(--radius-control)] border border-border-subtle bg-surface-2/85 p-1', className)}
    {...props}
  />
);

export const TabsTrigger = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      'inline-flex min-h-[2.2rem] items-center justify-center rounded-[calc(var(--radius-control)-0.2rem)] px-3 py-2 text-xs font-semibold text-text-3 transition data-[state=active]:bg-surface-1 data-[state=active]:text-text-1 data-[state=active]:shadow-xs',
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
