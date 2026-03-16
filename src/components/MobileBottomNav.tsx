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
}

function NavLinkItem({ href, label, icon, active }: MobileBottomNavItem) {
  return (
    <Link
      href={href}
      className={cn(
        'grid justify-items-center gap-1 px-1 pt-1.5 text-center text-[0.66rem] font-semibold tracking-[-0.01em] text-text-3 transition',
        active && 'text-text-1'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <span
        className={cn(
          'grid h-10 w-10 place-items-center rounded-[calc(var(--radius-control)+0.05rem)] transition',
          active ? 'bg-surface-1 text-text-1 shadow-xs' : 'text-text-3'
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
}: MobileBottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-canvas/92 px-3 pb-[calc(0.85rem+var(--safe-bottom))] pt-2 backdrop-blur-xl md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4.75rem_minmax(0,1fr)_minmax(0,1fr)] items-center">
        {leftItems.map((item) => (
          <NavLinkItem key={item.href} {...item} />
        ))}

        <div aria-hidden="true" />

        {rightItems.map((item) => (
          <NavLinkItem key={item.href} {...item} />
        ))}

        <button
          type="button"
          className={cn(
            'grid justify-items-center gap-1 px-1 pt-1.5 text-center text-[0.66rem] font-semibold tracking-[-0.01em] text-text-3 transition',
            moreActive && 'text-text-1'
          )}
          onClick={onMore}
          aria-pressed={moreActive}
        >
          <span
            className={cn(
              'grid h-10 w-10 place-items-center rounded-[calc(var(--radius-control)+0.05rem)] transition',
              moreActive ? 'bg-surface-1 text-text-1 shadow-xs' : 'text-text-3'
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
