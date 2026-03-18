"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { PageContainer } from "@/components/shared/PagePrimitives";
import { cn } from "@/lib/utils";

interface ShellHeaderProps {
  currentPage: string;
  notificationsLabel: string;
  notificationsActive: boolean;
  unreadCount: number;
  unreadBadgeLabel: string | number;
}

export default function ShellHeader({
  currentPage,
  notificationsLabel,
  notificationsActive,
  unreadCount,
  unreadBadgeLabel,
}: ShellHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border-subtle/75 bg-[var(--gradient-header)] backdrop-blur-xl lg:hidden">
      <PageContainer
        align="center"
        padding="header"
        className="flex min-h-[var(--mobile-header-height)] items-center justify-between gap-2 py-1"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-[0.9rem] border border-border-subtle/80 bg-surface-1/94 text-[0.6rem] font-extrabold tracking-[-0.06em] text-text-1 shadow-xs">
            DF
          </span>
          <div className="min-w-0" title={currentPage}>
            <span className="block truncate text-[0.8rem] font-semibold tracking-[-0.04em] text-text-1">
              DuitFlow
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/notifications"
            className={cn(
              "relative inline-flex h-9 w-9 items-center justify-center rounded-[calc(var(--radius-control)-0.02rem)] border border-border-subtle/80 bg-surface-1/94 text-text-3 transition-[background-color,border-color,color,box-shadow] duration-200 hover:border-border-strong hover:bg-surface-2/94 hover:text-text-1 hover:shadow-xs",
              notificationsActive && "bg-surface-2/94 text-text-1 shadow-xs",
            )}
            aria-label={notificationsLabel}
            title={notificationsLabel}
          >
            <Bell size={17} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[0.95rem] items-center justify-center rounded-full bg-accent px-1.25 py-0.5 text-[0.54rem] font-extrabold text-white">
                {unreadBadgeLabel}
              </span>
            ) : null}
          </Link>
        </div>
      </PageContainer>
    </header>
  );
}
