import { cn } from "@/lib/utils";

interface FieldErrorProps {
  message?: string;
  className?: string;
}

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p className={cn("m-0 text-sm font-medium text-danger", className)}>
      {message}
    </p>
  );
}
