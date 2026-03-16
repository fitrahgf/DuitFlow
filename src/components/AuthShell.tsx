'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export default function AuthShell({
  eyebrow,
  title,
  description,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-grid-soft opacity-40" />
      <div className="pointer-events-none absolute left-[8%] top-[7%] h-[min(26rem,52vw)] w-[min(26rem,52vw)] rounded-full bg-accent/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[8%] right-[6%] h-[min(20rem,42vw)] w-[min(20rem,42vw)] rounded-full bg-[color:var(--accent-secondary-soft)] blur-[90px]" />

      <Card className="relative z-10 w-full max-w-6xl overflow-hidden border-border-subtle bg-transparent shadow-md">
        <div className="grid lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
          <div className="grid content-center gap-8 border-b border-border-subtle bg-[var(--gradient-login-card)] p-6 lg:border-b-0 lg:border-r lg:p-8">
            <div className="grid gap-4">
              <span className="inline-flex w-fit items-center rounded-full bg-[var(--color-login-kicker-bg)] px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-accent-strong">
                Personal finance workspace
              </span>
              <div className="grid gap-3">
                <h1>
                  <Link
                    href="/login"
                    className="bg-[var(--gradient-login-title)] bg-clip-text text-[clamp(2.8rem,2.2rem+2vw,4.25rem)] font-extrabold leading-[0.9] tracking-[-0.08em] text-transparent"
                  >
                    DuitFlow
                  </Link>
                </h1>
                <p className="max-w-xl text-base text-text-2">
                  Calm finance tracking for daily use.
                </p>
              </div>
            </div>
          </div>

          <div className="grid content-center gap-6 bg-surface-1 p-6 lg:p-8">
            <div className="grid gap-2">
              <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                {eyebrow}
              </span>
              <h2 className="text-[clamp(1.65rem,1.38rem+0.6vw,2rem)] font-semibold tracking-[-0.04em]">
                {title}
              </h2>
              {description ? <p className="text-sm text-text-2">{description}</p> : null}
            </div>

            {children}

            {footer ? (
              <div className="text-sm text-text-2 [&_a]:font-semibold [&_a]:text-accent-strong hover:[&_a]:text-text-1">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
