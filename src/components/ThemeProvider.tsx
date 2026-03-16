'use client';

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from 'react';
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from 'next-themes';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeBridge({ children }: { children: ReactNode }) {
  const nextTheme = useNextTheme();

  const value = useMemo<ThemeContextType>(
    () => ({
      theme: (nextTheme.theme as Theme | undefined) ?? 'system',
      setTheme: (theme: Theme) => nextTheme.setTheme(theme),
      resolvedTheme: (nextTheme.resolvedTheme as 'light' | 'dark' | undefined) ?? 'dark',
    }),
    [nextTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      <ThemeBridge>{children}</ThemeBridge>
    </NextThemesProvider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
