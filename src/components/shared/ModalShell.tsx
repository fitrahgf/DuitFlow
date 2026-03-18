'use client';

import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ModalShellSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
type ModalShellPadding = 'default' | 'flush';
type ModalShellDensity = 'default' | 'compact';

const modalShellSizeClassName: Record<ModalShellSize, string> = {
  sm: 'max-w-[30rem]',
  md: 'max-w-[35rem]',
  lg: 'max-w-[40rem]',
  xl: 'max-w-[56rem]',
  full: 'max-w-[72rem]',
};

interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  size?: ModalShellSize;
  padding?: ModalShellPadding;
  hideClose?: boolean;
  headerHidden?: boolean;
  density?: ModalShellDensity;
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export function ModalShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  padding = 'default',
  hideClose = false,
  headerHidden = false,
  density = 'default',
  contentClassName,
  headerClassName,
  bodyClassName,
}: ModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        {...(!description ? { 'aria-describedby': undefined } : {})}
        className={cn(
          modalShellSizeClassName[size],
          padding === 'flush'
            ? 'overflow-hidden p-0'
            : density === 'compact'
              ? 'gap-3 rounded-[calc(var(--radius-sheet)-0.08rem)] px-4 py-3 sm:px-4.5 sm:py-4'
              : 'rounded-[var(--radius-sheet)] px-5 py-4 sm:px-6 sm:py-5',
          contentClassName
        )}
        hideClose={hideClose}
      >
        {title ? (
          <DialogHeader
            className={cn(
              headerHidden && 'sr-only',
              density === 'compact' && 'gap-1 pb-0',
              headerClassName
            )}
          >
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>
        ) : null}
        <div className={bodyClassName}>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
