"use client";

import Link from "next/link";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShellNavItem, ShellNavSection } from "./navigation";
import ShellUserMenu from "./ShellUserMenu";

interface SidebarProps {
  desktopSections: ShellNavSection[];
  tabletPrimary: ShellNavItem[];
  userInitials: string;
  profileName: string;
  userEmail?: string | null;
  activeAccountLabel: string;
  signOutLabel: string;
  quickTransactionLabel: string;
  moreLabel: string;
  unreadBadgeLabel: string | number;
  moreOpen: boolean;
  onOpenMore: () => void;
  onOpenQuickTransaction: () => void;
  onSignOut: () => void;
}

const sectionLabelClass =
  "px-2.5 py-0.5 text-[0.64rem] font-medium tracking-[0.01em] text-text-3";

const navLinkClass = (active: boolean) =>
  cn(
    "group inline-flex min-h-[2.12rem] items-center gap-2.5 rounded-[calc(var(--radius-control)-0.04rem)] px-2.5 py-[0.38rem] text-[0.76rem] font-medium tracking-[-0.01em] text-text-2 transition-[background-color,color] duration-200 hover:bg-surface-1/74 hover:text-text-1",
    active && "bg-surface-1 text-text-1",
  );

const navIconClass = (active: boolean) =>
  cn(
    "grid h-5 w-5 shrink-0 place-items-center text-text-3 transition-colors duration-200 group-hover:text-text-1",
    active && "text-accent-strong",
  );

export default function Sidebar({
  desktopSections,
  tabletPrimary,
  userInitials,
  profileName,
  userEmail,
  activeAccountLabel,
  signOutLabel,
  quickTransactionLabel,
  moreLabel,
  unreadBadgeLabel,
  moreOpen,
  onOpenMore,
  onOpenQuickTransaction,
  onSignOut,
}: SidebarProps) {
  const primarySections = desktopSections.filter(
    (section) => section.key !== "settings",
  );
  const utilitySection =
    desktopSections.find((section) => section.key === "settings") ?? null;

  return (
    <>
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border-subtle/72 bg-canvas/92 px-2.5 py-2.5 backdrop-blur-md lg:flex dark:bg-canvas/94">
        <div className="flex items-center gap-2.5 px-1.5 py-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-[0.88rem] bg-accent text-[0.64rem] font-extrabold tracking-[-0.04em] text-white shadow-xs">
            DF
          </span>
          <Link
            href="/dashboard"
            className="min-w-0 flex-1 truncate text-[0.84rem] font-semibold tracking-[-0.04em] text-text-1"
          >
            DuitFlow
          </Link>
        </div>

        <div className="mt-2 flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-0.5">
            {primarySections.map((section) => (
              <div key={section.key} className="grid gap-0.75">
                {section.key === "planning" ? (
                  <span className={sectionLabelClass}>{section.label}</span>
                ) : null}
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={navLinkClass(item.active)}
                  >
                    <span className={navIconClass(item.active)}>
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    {item.badgeCount > 0 ? (
                      <span className="inline-flex min-w-[1rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[0.52rem] font-extrabold text-white">
                        {unreadBadgeLabel}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2.5 border-t border-border-subtle/55 pt-3">
            {utilitySection ? (
              <nav className="grid gap-0.75">
                {utilitySection.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={navLinkClass(item.active)}
                  >
                    <span className={navIconClass(item.active)}>
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    {item.badgeCount > 0 ? (
                      <span className="inline-flex min-w-[1rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[0.52rem] font-extrabold text-white">
                        {unreadBadgeLabel}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </nav>
            ) : null}

            <ShellUserMenu
              activeAccountLabel={activeAccountLabel}
              initials={userInitials}
              profileName={profileName}
              signOutLabel={signOutLabel}
              userEmail={userEmail}
              onSignOut={onSignOut}
            />
          </div>
        </div>
      </aside>

      <aside className="sticky top-0 hidden h-screen flex-col items-center gap-2 border-r border-border-subtle/72 bg-canvas/92 px-2 py-2.5 backdrop-blur-md md:flex lg:hidden dark:bg-canvas/94">
        <Link
          href="/dashboard"
          className="grid h-[2.35rem] w-[2.35rem] place-items-center rounded-[0.88rem] border border-border-subtle/80 bg-surface-1 text-[0.6rem] font-extrabold tracking-[-0.04em] shadow-xs"
          aria-label="DuitFlow"
        >
          DF
        </Link>

        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-[2.35rem] w-[2.35rem] rounded-[0.88rem] border-accent/10 bg-accent-soft/90 text-accent-strong shadow-none hover:bg-accent-soft"
          onClick={onOpenQuickTransaction}
          aria-label={quickTransactionLabel}
          title={quickTransactionLabel}
        >
          <Plus size={18} />
        </Button>

        <nav className="mt-0.5 grid gap-1">
          {tabletPrimary.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative grid h-[2.35rem] w-[2.35rem] place-items-center rounded-[0.88rem] text-text-3 transition hover:bg-surface-1/80 hover:text-text-1",
                item.active && "bg-surface-1 text-text-1",
              )}
              aria-current={item.active ? "page" : undefined}
              title={item.label}
            >
              {item.icon}
              {item.badgeCount > 0 ? (
                <span className="absolute right-0 top-0 inline-flex min-w-[1rem] items-center justify-center rounded-full bg-accent px-1 py-0.5 text-[0.56rem] font-extrabold text-white">
                  {unreadBadgeLabel}
                </span>
              ) : null}
            </Link>
          ))}

          <button
            type="button"
            className={cn(
              "grid h-[2.35rem] w-[2.35rem] place-items-center rounded-[0.88rem] text-text-3 transition hover:bg-surface-1/80 hover:text-text-1",
              moreOpen && "bg-surface-1 text-text-1",
            )}
            onClick={onOpenMore}
            title={moreLabel}
            aria-label={moreLabel}
          >
            <Menu size={18} />
          </button>
        </nav>

        <ShellUserMenu
          variant="tablet"
          initials={userInitials}
          profileName={profileName}
          signOutLabel={signOutLabel}
          onSignOut={onSignOut}
        />
      </aside>
    </>
  );
}
