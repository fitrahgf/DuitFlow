import type {
  ComponentPropsWithoutRef,
  HTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export function FormField({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-1.5", className)} {...props} />;
}

export function FormLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1 text-[var(--font-size-helper)] font-medium tracking-[0.01em] text-text-2",
        className,
      )}
      {...props}
    />
  );
}

export function FormLegend({
  className,
  ...props
}: ComponentPropsWithoutRef<"legend">) {
  return (
    <legend
      className={cn(
        "inline-flex items-center gap-1 text-[var(--font-size-helper)] font-medium tracking-[0.01em] text-text-2",
        className,
      )}
      {...props}
    />
  );
}

export function FormHint({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn("m-0 text-[0.78rem] leading-5 text-text-3", className)}
      {...props}
    />
  );
}

interface FormSectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  step: string;
  title: string;
  description?: string;
  tone?: "default" | "light";
  stepVariant?: "badge" | "inline";
}

export function FormSectionHeader({
  step,
  title,
  description,
  tone = "default",
  stepVariant = "badge",
  className,
  ...props
}: FormSectionHeaderProps) {
  const lightTone = tone === "light";

  return (
    <div
      className={cn(
        "grid items-start",
        stepVariant === "inline"
          ? "grid-cols-[auto_1fr] gap-2"
          : "grid-cols-[auto_1fr] gap-2.5",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          stepVariant === "inline"
            ? "pt-0.5 text-[var(--font-size-meta)] font-medium tracking-[0.01em] text-text-2"
            : "inline-flex min-h-[1.45rem] min-w-[1.45rem] items-center justify-center rounded-full border border-border-subtle bg-surface-2/75 px-1.5 text-[var(--font-size-chip)] font-semibold tracking-[0.01em] text-text-2",
        )}
      >
        {step}
      </span>
      <div className="grid gap-0.5">
        <strong
          className={cn(
            lightTone
              ? "text-[0.86rem] font-medium tracking-[-0.02em] text-text-2"
              : "text-[0.95rem] font-semibold tracking-[-0.03em] text-text-1",
          )}
        >
          {title}
        </strong>
        {description ? (
          <span className="text-[0.78rem] leading-5 text-text-3">{description}</span>
        ) : null}
      </div>
    </div>
  );
}

interface FormMetaChipProps extends HTMLAttributes<HTMLSpanElement> {
  icon: ReactNode;
  value: ReactNode;
  variant?: "default" | "subtle";
}

export function FormMetaChip({
  icon,
  value,
  variant = "default",
  className,
  ...props
}: FormMetaChipProps) {
  return (
    <span
      className={cn(
        variant === "subtle"
          ? "inline-flex min-h-[1.65rem] items-center gap-1 rounded-full border border-border-subtle/75 bg-surface-1/65 px-2 py-0.5"
          : "inline-flex min-h-[1.78rem] items-center gap-1.5 rounded-full border border-border-subtle/90 bg-surface-1/78 px-2.25 py-0.5",
        className,
      )}
      {...props}
    >
      <span className="text-text-3">{icon}</span>
      <span
        className={cn(
          "truncate text-text-1",
          variant === "subtle" ? "text-[0.72rem] font-medium" : "text-[0.76rem] font-medium",
        )}
      >
        {value}
      </span>
    </span>
  );
}
