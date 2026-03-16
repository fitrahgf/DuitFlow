import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export const Switch = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-surface-3 transition data-[state=checked]:bg-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-soft/70',
      className
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-xs transition data-[state=checked]:translate-x-5" />
  </SwitchPrimitives.Root>
);
