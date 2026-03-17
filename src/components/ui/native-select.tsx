import * as React from "react";
import { cn } from "@/lib/utils";

const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex min-h-[var(--control-height)] w-full rounded-[var(--radius-control)] border border-border-subtle/90 bg-surface-1 px-3.5 py-2 text-sm text-text-1 shadow-none outline-none transition-[background-color,border-color,box-shadow] duration-200 hover:border-border-strong hover:bg-surface-2/45 focus:border-accent focus:bg-surface-1 focus:ring-4 focus:ring-accent-soft/65 aria-[invalid=true]:border-danger/70 aria-[invalid=true]:bg-danger-soft/10 aria-[invalid=true]:focus:ring-danger-soft/70 disabled:cursor-not-allowed disabled:bg-surface-2/72 disabled:text-text-2 disabled:opacity-80",
      className,
    )}
    {...props}
  />
));
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
