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
        'grid min-h-[3.2rem] justify-items-center gap-0.5 px-1 pt-0.5 text-center text-[0.58rem] font-semibold tracking-[-0.01em] text-text-3 transition-all duration-300',
        active && 'text-text-1'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'grid h-[2.15rem] w-[2.15rem] place-items-center rounded-[calc(var(--radius-control)+0.08rem)] border border-transparent transition-all duration-300',
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
      className="fixed inset-x-0 bottom-0 z-40 px-2.5 pb-[calc(0.45rem+var(--safe-bottom))] pt-1 md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid max-w-[27.5rem] grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.7rem_minmax(0,1fr)_minmax(0,1fr)] items-center rounded-[1.2rem] border border-border-subtle bg-[color:hsla(0,0%,100%,0.9)] px-1 py-0.5 shadow-sm backdrop-blur-xl dark:bg-[color:hsla(156,14%,12%,0.94)]">
        {leftItems.map((item) => (
          <NavLinkItem key={item.href} {...item} />
        ))}

        <button
          type="button"
          className="grid min-h-[3.2rem] justify-items-center gap-0.5 text-center text-[0.58rem] font-semibold tracking-[-0.01em] text-text-1"
          onClick={onAction}
          aria-label={actionLabel}
        >
          <span className="grid h-[2.35rem] w-[2.35rem] place-items-center rounded-[0.95rem] bg-accent text-white shadow-sm">
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
            'grid min-h-[3.2rem] justify-items-center gap-0.5 px-1 pt-0.5 text-center text-[0.58rem] font-semibold tracking-[-0.01em] text-text-3 transition-all duration-300',
            moreActive && 'text-text-1'
          )}
          onClick={onMore}
          aria-pressed={moreActive}
        >
          <span
            className={cn(
              'grid h-[2.15rem] w-[2.15rem] place-items-center rounded-[calc(var(--radius-control)+0.08rem)] border border-transparent transition-all duration-300',
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
