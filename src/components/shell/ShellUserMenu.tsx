"use client";

import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShellUserMenuProps {
  variant?: "desktop" | "tablet";
  initials: string;
  profileName: string;
  userEmail?: string | null;
  activeAccountLabel?: string;
  signOutLabel: string;
  onSignOut: () => void;
}

export default function ShellUserMenu({
  variant = "desktop",
  initials,
  profileName,
  userEmail,
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
    <div className="flex items-center gap-2.5 px-1 py-1.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[0.88rem] bg-surface-1 text-[0.72rem] font-semibold tracking-[-0.03em] text-text-1">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <strong className="block truncate text-[0.76rem] font-semibold tracking-[-0.02em] text-text-1">
          {profileName}
        </strong>
        <span className="block truncate text-[0.68rem] text-text-3">
          {userEmail || activeAccountLabel}
        </span>
      </div>
      <button
        type="button"
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-text-3 transition-[background-color,color] duration-200 hover:bg-surface-1 hover:text-text-1",
        )}
        onClick={onSignOut}
        title={signOutLabel}
        aria-label={signOutLabel}
      >
        <LogOut size={14} className="text-current" />
      </button>
    </div>
  );
}
