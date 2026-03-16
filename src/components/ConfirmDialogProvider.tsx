'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ConfirmTone = 'default' | 'danger';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const value = useMemo<ConfirmDialogContextValue>(
    () => ({
      confirm: (nextOptions) =>
        new Promise<boolean>((resolve) => {
          resolverRef.current = resolve;
          setOptions(nextOptions);
        }),
    }),
    []
  );

  const closeDialog = (result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  };

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <AlertDialog open={Boolean(options)} onOpenChange={(open) => !open && closeDialog(false)}>
        {options ? (
          <AlertDialogContent className="animate-slide-in">
            <AlertDialogHeader>
              <AlertDialogTitle>{options.title}</AlertDialogTitle>
              {options.description ? (
                <AlertDialogDescription>{options.description}</AlertDialogDescription>
              ) : null}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={cn(buttonVariants({ variant: 'secondary' }))}>
                {options.cancelLabel ?? 'Cancel'}
              </AlertDialogCancel>
              <AlertDialogAction
                className={cn(
                  buttonVariants({ variant: options.tone === 'danger' ? 'danger' : 'primary' })
                )}
                onClick={(event) => {
                  event.preventDefault();
                  closeDialog(true);
                }}
              >
                {options.confirmLabel ?? 'Confirm'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider.');
  }

  return context.confirm;
}
