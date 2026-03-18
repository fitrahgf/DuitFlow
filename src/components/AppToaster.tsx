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
          'rounded-[1.35rem] border border-border-subtle/85 bg-surface-1/94 text-text-1 shadow-sm backdrop-blur-xl',
      }}
    />
  );
}
