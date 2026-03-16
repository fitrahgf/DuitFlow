'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';

export function AppToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      closeButton
      position="top-right"
      richColors
      theme={resolvedTheme}
      toastOptions={{
        className:
          'rounded-[1.35rem] border border-border-subtle bg-surface-1 text-text-1 shadow-sm',
      }}
    />
  );
}
