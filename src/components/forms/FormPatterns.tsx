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
    <section className={cn("grid gap-3", className)} {...props}>
      <FormSectionHeader step={step} title={title} description={description} />
      <div className={cn("grid gap-2.5", contentClassName)}>{children}</div>
    </section>
  );
}

export function FieldRow({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)} {...props} />
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
        "grid gap-2.5",
        sticky &&
          "sticky bottom-0 z-10 -mx-1 grid-cols-1 border-t border-border-subtle bg-surface-1 px-1 pb-1 pt-3",
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
        "border-border-subtle bg-surface-2/55 p-3 shadow-none",
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-center gap-2 text-sm text-text-2">
        {children}
      </div>
    </Card>
  );
}
