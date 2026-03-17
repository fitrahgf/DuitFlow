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
  return <div className={cn("grid gap-2", className)} {...props} />;
}

export function FormLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<"label">) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-text-3",
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
        "inline-flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-text-3",
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
      className={cn("m-0 text-xs leading-5 text-text-3", className)}
      {...props}
    />
  );
}

interface FormSectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  step: string;
  title: string;
  description?: string;
}

export function FormSectionHeader({
  step,
  title,
  description,
  className,
  ...props
}: FormSectionHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)} {...props}>
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-text-3">
        {step}
      </span>
      <div className="grid gap-0.5">
        <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
          {title}
        </strong>
        {description ? (
          <span className="text-sm text-text-3">{description}</span>
        ) : null}
      </div>
    </div>
  );
}

interface FormMetaChipProps extends HTMLAttributes<HTMLSpanElement> {
  icon: ReactNode;
  value: ReactNode;
}

export function FormMetaChip({
  icon,
  value,
  className,
  ...props
}: FormMetaChipProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-[2rem] items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-2.5 py-1",
        className,
      )}
      {...props}
    >
      <span className="text-text-3">{icon}</span>
      <span className="font-medium text-text-1">{value}</span>
    </span>
  );
}
