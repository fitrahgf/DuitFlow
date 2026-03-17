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
      <SheetContent side="bottom" hideClose className="max-w-[32rem] rounded-t-[var(--radius-sheet)] px-4 pb-[calc(1rem+var(--safe-bottom))] pt-3">
        <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-border-strong" />

        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-text-3">{title}</span>
            <SheetTitle className="text-[1rem] tracking-[-0.04em]">DuitFlow</SheetTitle>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label={title} title={title} className="h-10 w-10">
            <X size={18} />
          </Button>
        </div>

        <Card className="mb-3.5 grid gap-2.5 border-border-subtle bg-surface-2/70 p-3 shadow-none">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[0.95rem] bg-surface-1 text-sm font-semibold text-text-1 shadow-xs">
              {(userName || 'User').slice(0, 2).toUpperCase()}
            </div>
            <div className="grid min-w-0 gap-0.5">
              <strong className="truncate text-sm tracking-[-0.02em]">{userName || 'User'}</strong>
              <span className="truncate text-xs text-text-3">{userEmail || signOutLabel}</span>
            </div>
          </div>

          <Button type="button" variant="secondary" fullWidth onClick={onSignOut} className="justify-between px-3.5">
            <LogOut size={16} />
            <span>{signOutLabel}</span>
          </Button>
        </Card>

        <div className="grid gap-2.5">
          {sections.map((section) => {
            const sectionItems = items.filter((item) => item.group === section.key);
            if (sectionItems.length === 0) {
              return null;
            }

            return (
              <div
                key={section.key}
                className="grid gap-1 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-1/85 p-2"
              >
                <span className="px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-3">
                  {section.label}
                </span>
                {sectionItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'grid min-h-[3rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[calc(var(--radius-control)+0.05rem)] border border-transparent px-3 py-2 text-text-3 transition-all duration-300 hover:border-border-subtle hover:bg-surface-2 hover:text-text-1',
                      item.active && 'border-border-subtle bg-surface-2 text-text-1'
                    )}
                    onClick={onClose}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-[calc(var(--radius-control)-0.08rem)] bg-surface-2 text-text-1">
                      {item.icon}
                    </span>
                    <span className="min-w-0 truncate text-sm font-semibold tracking-[-0.02em]">{item.label}</span>
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full bg-transparent',
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
