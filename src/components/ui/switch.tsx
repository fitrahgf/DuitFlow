import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export const Switch = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border-subtle/80 bg-surface-3/92 transition data-[state=checked]:border-accent/30 data-[state=checked]:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-soft/70',
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-xs transition data-[state=checked]:translate-x-5 dark:bg-[hsl(var(--bg-canvas-channel))]" />
  </SwitchPrimitives.Root>
);
