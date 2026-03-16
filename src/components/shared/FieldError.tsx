import { cn } from '@/lib/utils';

interface FieldErrorProps {
  message?: string;
  className?: string;
}

export function FieldError({ message, className }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return <p className={cn('field-error', className)}>{message}</p>;
}
