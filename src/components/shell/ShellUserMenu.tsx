"use client";

import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShellUserMenuProps {
  variant?: "desktop" | "tablet";
  initials: string;
  profileName: string;
  userEmail?: string | null;
  accountLabel?: string;
  activeAccountLabel?: string;
  signOutLabel: string;
  onSignOut: () => void;
}

export default function ShellUserMenu({
  variant = "desktop",
  initials,
  profileName,
  userEmail,
  accountLabel,
  activeAccountLabel,
  signOutLabel,
  onSignOut,
}: ShellUserMenuProps) {
  if (variant === "tablet") {
    return (
      <button
        type="button"
        className="mt-auto grid h-[2.35rem] w-[2.35rem] place-items-center rounded-[0.88rem] border border-border-subtle/80 bg-surface-1 text-[0.6rem] font-semibold text-text-1"
        onClick={onSignOut}
        title={signOutLabel}
      >
        {initials}
      </button>
    );
  }

  return (
    <div className="rounded-[calc(var(--radius-card)-0.12rem)] border border-border-subtle/70 bg-surface-1 p-1.5 shadow-none">
      {accountLabel ? (
        <span className="mb-1.5 flex items-center gap-1.5 px-0.5 text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-text-3/78">
          <span
            className="h-1 w-1 rounded-full bg-accent/65"
            aria-hidden="true"
          />
          {accountLabel}
        </span>
      ) : null}

      <div className="grid gap-2">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 px-0.5">
          <div className="grid h-9 w-9 place-items-center rounded-[0.9rem] bg-surface-2 text-[0.72rem] font-semibold tracking-[-0.03em] text-text-1">
            {initials}
          </div>
          <div className="min-w-0">
            <strong className="block truncate text-[0.76rem] font-semibold tracking-[-0.02em] text-text-1">
              {profileName}
            </strong>
            <span className="block truncate text-[0.68rem] text-text-3">
              {userEmail || activeAccountLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          className={cn(
            "group flex min-h-[var(--control-height-sm)] w-full items-center justify-between rounded-[calc(var(--radius-control)-0.08rem)] bg-surface-2/78 px-2.5 py-1 text-left text-[0.74rem] font-medium text-text-2 transition-[background-color,color] duration-200",
            "hover:bg-surface-2 hover:text-text-1",
          )}
          onClick={onSignOut}
          title={signOutLabel}
        >
          <span>{signOutLabel}</span>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-1/88 text-text-3 transition-colors duration-200 group-hover:text-text-1">
            <LogOut size={13} className="text-current" />
          </span>
        </button>
      </div>
    </div>
  );
}
