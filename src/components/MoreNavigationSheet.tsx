'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/components/LanguageProvider';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface MoreNavigationItem {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  group: 'core' | 'planning' | 'settings';
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
  const { language } = useLanguage();
  const sections: Array<{ key: MoreNavigationItem['group']; label: string }> = [
    { key: 'core', label: language === 'id' ? 'Ruang kerja' : 'Workspace' },
    { key: 'planning', label: language === 'id' ? 'Perencanaan' : 'Planning' },
    { key: 'settings', label: language === 'id' ? 'Sistem' : 'System' },
  ];

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <SheetContent side="bottom" hideClose className="max-w-[29rem] rounded-t-[var(--radius-sheet)] px-[var(--page-gutter)] pb-[calc(var(--page-bottom-space)+var(--safe-bottom))] pt-2">
        <div className="mx-auto mb-1.5 h-1 w-8 rounded-full bg-border-strong" />

        <div className="mb-2 flex items-start justify-between gap-3 border-b border-border-subtle/75 pb-2">
          <div className="grid gap-0.5">
            <span className="text-[var(--font-size-chip)] font-medium tracking-[0.01em] text-text-2">{title}</span>
            <SheetTitle className="text-[0.92rem] tracking-[-0.04em]">DuitFlow</SheetTitle>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={title} title={title}>
            <X size={18} />
          </Button>
        </div>

        <Card className="mb-2.5 grid gap-2 border-border-subtle bg-surface-2/60 p-2 shadow-none">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-[0.8rem] bg-surface-1 text-[0.78rem] font-semibold text-text-1 shadow-xs">
              {(userName || 'User').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-[0.82rem] tracking-[-0.02em]">{userName || 'User'}</strong>
              {userEmail ? <span className="block truncate text-[0.72rem] text-text-3">{userEmail}</span> : null}
            </div>
          </div>

          <Button type="button" variant="secondary" fullWidth onClick={onSignOut} className="min-h-[2.15rem] justify-between px-3 text-[0.78rem]">
            <LogOut size={16} />
            <span>{signOutLabel}</span>
          </Button>
        </Card>

        <div className="grid gap-1.5">
          {sections.map((section) => {
            const sectionItems = items.filter((item) => item.group === section.key);
            if (sectionItems.length === 0) {
              return null;
            }

            return (
              <div
                key={section.key}
                className="grid gap-1 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-1/90 p-1.5"
              >
                <span className="px-1.5 py-0.5 text-[var(--font-size-chip)] font-medium tracking-[0.01em] text-text-2">
                  {section.label}
                </span>
                {sectionItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'grid min-h-[2.2rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 rounded-[calc(var(--radius-control)-0.08rem)] border border-transparent px-2 py-1 text-text-3 transition-all duration-300 hover:border-border-subtle hover:bg-surface-2 hover:text-text-1',
                      item.active && 'border-border-subtle bg-accent-soft/30 text-text-1'
                    )}
                    onClick={onClose}
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-[calc(var(--radius-control)-0.16rem)] bg-surface-2 text-text-1">
                      {item.icon}
                    </span>
                    <span className="min-w-0 truncate text-[0.78rem] font-semibold tracking-[-0.02em]">{item.label}</span>
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full bg-transparent',
                        item.active && 'bg-accent'
                      )}
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
