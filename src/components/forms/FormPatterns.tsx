import type { ComponentPropsWithoutRef, HTMLAttributes } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FormSectionHeader } from "./FormPrimitives";

interface FormSectionProps extends HTMLAttributes<HTMLElement> {
  step: string;
  title: string;
  description?: string;
  contentClassName?: string;
}

export function FormSection({
  step,
  title,
  description,
  className,
  contentClassName,
  children,
  ...props
}: FormSectionProps) {
  return (
    <section className={cn("grid gap-2.5", className)} {...props}>
      <FormSectionHeader step={step} title={title} description={description} />
      <div className="rounded-[calc(var(--radius-card)-0.14rem)] border border-border-subtle bg-surface-2/35 p-3 shadow-none sm:p-3.5">
        <div className={cn("grid gap-2.5", contentClassName)}>{children}</div>
      </div>
    </section>
  );
}

export function FieldRow({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid gap-2.5 md:grid-cols-2", className)} {...props} />
  );
}

interface FormActionsProps extends HTMLAttributes<HTMLDivElement> {
  sticky?: boolean;
}

export function FormActions({
  sticky = false,
  className,
  ...props
}: FormActionsProps) {
  return (
    <div
      className={cn(
        "grid gap-2",
        sticky &&
          "sticky bottom-0 z-10 grid-cols-1 border-t border-border-subtle/80 bg-surface-1/96 pb-[calc(0.25rem+var(--safe-bottom))] pt-3 backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}

type SaveHintsProps = ComponentPropsWithoutRef<typeof Card>;

export function SaveHints({
  className,
  children,
  ...props
}: SaveHintsProps) {
  return (
    <Card
      className={cn(
        "border-border-subtle/90 bg-surface-2/42 p-2.5 shadow-none",
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-[0.78rem] text-text-2">
        {children}
      </div>
    </Card>
  );
}
