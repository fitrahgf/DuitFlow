'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileBottomNavItem {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}

interface MobileBottomNavProps {
  leftItems: MobileBottomNavItem[];
  rightItems: MobileBottomNavItem[];
  moreLabel: string;
  moreIcon: ReactNode;
  moreActive: boolean;
  onMore: () => void;
  actionLabel: string;
  actionIcon: ReactNode;
  onAction: () => void;
}

function NavLinkItem({ href, label, icon, active }: MobileBottomNavItem) {
  return (
    <Link
      href={href}
      className={cn(
        'grid min-h-[3.75rem] justify-items-center gap-0.5 px-1 pt-1 text-center text-[0.62rem] font-semibold tracking-[-0.01em] text-text-3 transition-all duration-300',
        active && 'text-text-1'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'grid h-10 w-10 place-items-center rounded-[calc(var(--radius-control)+0.12rem)] border border-transparent transition-all duration-300',
          active
            ? 'border-border-subtle bg-surface-1 text-text-1 shadow-xs'
            : 'text-text-3'
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

export default function MobileBottomNav({
  leftItems,
  rightItems,
  moreLabel,
  moreIcon,
  moreActive,
  onMore,
  actionLabel,
  actionIcon,
  onAction,
}: MobileBottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.55rem+var(--safe-bottom))] pt-1.5 md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid max-w-[29rem] grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4.1rem_minmax(0,1fr)_minmax(0,1fr)] items-center rounded-[1.45rem] border border-border-subtle bg-[color:hsla(0,0%,100%,0.88)] px-1.5 py-0.5 shadow-md backdrop-blur-xl dark:bg-[color:hsla(156,14%,12%,0.92)]">
        {leftItems.map((item) => (
          <NavLinkItem key={item.href} {...item} />
        ))}

        <button
          type="button"
          className="grid min-h-[3.75rem] justify-items-center gap-0.5 text-center text-[0.58rem] font-semibold tracking-[-0.01em] text-text-1"
          onClick={onAction}
          aria-label={actionLabel}
        >
          <span className="grid h-11 w-11 place-items-center rounded-[1rem] bg-accent text-white shadow-md">
            {actionIcon}
          </span>
          <span>{actionLabel}</span>
        </button>

        {rightItems.map((item) => (
          <NavLinkItem key={item.href} {...item} />
        ))}

        <button
          type="button"
          className={cn(
            'grid min-h-[3.75rem] justify-items-center gap-0.5 px-1 pt-1 text-center text-[0.62rem] font-semibold tracking-[-0.01em] text-text-3 transition-all duration-300',
            moreActive && 'text-text-1'
          )}
          onClick={onMore}
          aria-pressed={moreActive}
        >
          <span
            className={cn(
              'grid h-10 w-10 place-items-center rounded-[calc(var(--radius-control)+0.12rem)] border border-transparent transition-all duration-300',
              moreActive ? 'border-border-subtle bg-surface-1 text-text-1 shadow-xs' : 'text-text-3'
            )}
          >
            {moreIcon}
          </span>
          <span>{moreLabel}</span>
        </button>
      </div>
    </nav>
  );
}
