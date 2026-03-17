import * as React from "react";
import { cn } from "@/lib/utils";

const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex min-h-[2.85rem] w-full rounded-[var(--radius-control)] border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-text-1 outline-none transition-all duration-200 hover:border-border-strong hover:bg-surface-2/55 focus:border-accent focus:ring-4 focus:ring-accent-soft/70 disabled:cursor-not-allowed disabled:opacity-70",
      className,
    )}
    {...props}
  />
));
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
