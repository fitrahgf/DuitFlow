import type {
  ChangeEventHandler,
  HTMLAttributes,
  SelectHTMLAttributes,
} from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

export function FilterToolbar({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("grid gap-3", className)} {...props} />;
}

export function ToolbarActions({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex gap-2 max-sm:overflow-x-auto max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  );
}

interface FilterGroupProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  contentClassName?: string;
  labelClassName?: string;
}

export function FilterGroup({
  label,
  className,
  contentClassName,
  labelClassName,
  children,
  ...props
}: FilterGroupProps) {
  return (
    <div
      className={cn(
        "grid gap-1.5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-text-3 md:text-sm md:font-medium md:normal-case md:tracking-normal",
          labelClassName,
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:pb-0",
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface FilterFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor?: string;
  labelClassName?: string;
}

export function FilterField({
  label,
  htmlFor,
  className,
  labelClassName,
  children,
  ...props
}: FilterFieldProps) {
  return (
    <div className={cn("grid gap-2", className)} {...props}>
      <label
        className={cn(
          "text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-text-3",
          labelClassName,
        )}
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function FilterFieldGrid({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)} {...props} />
  );
}

interface FilterSearchFieldProps {
  id: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder: string;
  clearLabel?: string;
  onClear?: () => void;
  className?: string;
  inputClassName?: string;
}

export function FilterSearchField({
  id,
  value,
  onChange,
  placeholder,
  clearLabel,
  onClear,
  className,
  inputClassName,
}: FilterSearchFieldProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-[2.95rem] items-center gap-3 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-2/70 px-3.5 transition-all duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft/70 sm:min-h-[3.15rem] sm:px-4",
        className,
      )}
    >
      <Search size={18} className="text-text-3" />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "min-h-0 border-0 bg-transparent px-0 py-0 shadow-none ring-0 focus:ring-0",
          inputClassName,
        )}
      />
      {value && onClear && clearLabel ? (
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-3 transition hover:bg-surface-1 hover:text-text-1"
          onClick={onClear}
          aria-label={clearLabel}
        >
          <X size={16} />
        </button>
      ) : null}
    </label>
  );
}

export function FilterSelect({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <NativeSelect
      className={cn("min-h-[3rem] rounded-xl px-4 py-3", className)}
      {...props}
    />
  );
}
