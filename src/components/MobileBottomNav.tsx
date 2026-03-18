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
        'grid min-h-[3rem] justify-items-center gap-0.5 px-1 pt-0.5 text-center text-[0.72rem] font-semibold tracking-[-0.01em] text-text-3 transition-all duration-300',
        active && 'text-text-1'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'grid h-[2.02rem] w-[2.02rem] place-items-center rounded-[0.78rem] border border-transparent transition-all duration-300',
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
      className="fixed inset-x-0 bottom-0 z-40 px-2.5 pb-[calc(0.4rem+var(--safe-bottom))] pt-1 md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid max-w-[25rem] grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.65rem_minmax(0,1fr)_minmax(0,1fr)] items-end rounded-[1rem] border border-border-subtle/90 bg-[color:hsla(0,0%,100%,0.94)] px-1.5 pb-1 pt-[0.85rem] shadow-[0_16px_36px_-24px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:bg-[color:hsla(156,14%,12%,0.96)]">
        {leftItems.map((item) => (
          <NavLinkItem key={item.href} {...item} />
        ))}

        <button
          type="button"
          className="grid min-h-[3.15rem] -translate-y-1 justify-items-center gap-0.5 text-center text-[0.7rem] font-semibold tracking-[-0.01em] text-text-1"
          onClick={onAction}
          aria-label={actionLabel}
        >
          <span className="grid h-[2.56rem] w-[2.56rem] place-items-center rounded-[0.92rem] bg-accent text-white shadow-[0_14px_24px_-16px_rgba(21,128,94,0.8)]">
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
            'grid min-h-[3rem] justify-items-center gap-0.5 px-1 pt-0.5 text-center text-[0.72rem] font-semibold tracking-[-0.01em] text-text-3 transition-all duration-300',
            moreActive && 'text-text-1'
          )}
          onClick={onMore}
          aria-pressed={moreActive}
        >
          <span
            className={cn(
              'grid h-[2.02rem] w-[2.02rem] place-items-center rounded-[0.78rem] border border-transparent transition-all duration-300',
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
