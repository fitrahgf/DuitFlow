'use client';

import type { ReactNode } from 'react';
import { AppToaster } from '@/components/AppToaster';
import { ConfirmDialogProvider } from '@/components/ConfirmDialogProvider';
import { LanguageProvider } from '@/components/LanguageProvider';
import { QueryProvider } from '@/components/QueryProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <QueryProvider>
          <ConfirmDialogProvider>
            {children}
            <AppToaster />
          </ConfirmDialogProvider>
        </QueryProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
