'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface MoreNavigationItem {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}

interface MoreNavigationSheetProps {
  open: boolean;
  title: string;
  items: MoreNavigationItem[];
  signOutLabel: string;
  onClose: () => void;
  onSignOut: () => void;
  userName?: string | null;
  userEmail?: string | null;
}

export default function MoreNavigationSheet({
  open,
  title,
  items,
  signOutLabel,
  onClose,
  onSignOut,
  userName,
  userEmail,
}: MoreNavigationSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <SheetContent side="bottom" hideClose className="max-w-[32rem] rounded-t-[var(--radius-sheet)] px-4 pb-6 pt-4">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong" />

        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-3">{title}</span>
            <SheetTitle className="text-lg">DuitFlow</SheetTitle>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={title} title={title}>
            <X size={18} />
          </Button>
        </div>

        <Card className="mb-4 grid gap-3 border-border-subtle bg-surface-2/75 p-4 shadow-none">
          <div className="grid gap-1">
            <strong>{userName || 'User'}</strong>
            <span className="text-sm text-text-3">{userEmail || signOutLabel}</span>
          </div>

          <Button type="button" variant="secondary" fullWidth onClick={onSignOut}>
            <LogOut size={16} />
            <span>{signOutLabel}</span>
          </Button>
        </Card>

        <div className="grid grid-cols-2 gap-2.5">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'grid gap-2.5 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-1 p-4 text-text-3 transition hover:border-border-strong hover:bg-surface-2 hover:text-text-1',
                item.active && 'border-border-strong bg-surface-2 text-text-1'
              )}
              onClick={onClose}
            >
              <span className="grid h-9 w-9 place-items-center rounded-[calc(var(--radius-control)+0.05rem)] bg-surface-2 text-text-1">
                {item.icon}
              </span>
              <span className="text-sm font-semibold">{item.label}</span>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
