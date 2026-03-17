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
    <header className="sticky top-0 z-30 border-b border-border-subtle/80 bg-canvas/95 backdrop-blur-xl lg:hidden">
      <PageContainer
        align="center"
        padding="header"
        className="flex items-center justify-between gap-2.5 py-1.5 md:py-1.5"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-[0.8rem] border border-border-subtle bg-surface-1 text-[0.64rem] font-extrabold tracking-[-0.04em] text-text-1">
            DF
          </span>
          <div className="min-w-0 grid gap-0.5">
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-text-3">
              DuitFlow
            </span>
            <h2 className="truncate text-[0.88rem] font-semibold tracking-[-0.03em] text-text-1">
              {currentPage}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className={cn(
              "relative inline-flex h-[2.35rem] w-[2.35rem] items-center justify-center rounded-[calc(var(--radius-control)+0.08rem)] border border-border-subtle bg-surface-1 text-text-3 transition-all duration-300 hover:border-border-strong hover:bg-surface-2 hover:text-text-1",
              notificationsActive && "bg-surface-2 text-text-1 shadow-xs",
            )}
            aria-label={notificationsLabel}
            title={notificationsLabel}
          >
            <Bell size={18} />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[0.58rem] font-extrabold text-white">
                {unreadBadgeLabel}
              </span>
            ) : null}
          </Link>
        </div>
      </PageContainer>
    </header>
  );
}
