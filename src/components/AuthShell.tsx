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
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute left-[8%] top-[7%] h-[min(26rem,52vw)] w-[min(26rem,52vw)] rounded-full bg-accent/18 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[8%] right-[6%] h-[min(20rem,42vw)] w-[min(20rem,42vw)] rounded-full bg-[color:var(--accent-secondary-soft)] blur-[100px]" />

      <Card className="relative z-10 w-full max-w-6xl overflow-hidden border-border-subtle bg-transparent shadow-md">
        <div className="grid lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)]">
          <div className="grid content-between gap-10 border-b border-border-subtle bg-[var(--gradient-login-card)] p-6 lg:min-h-[42rem] lg:border-b-0 lg:border-r lg:p-9">
            <div className="grid gap-5">
              <span className="inline-flex w-fit items-center rounded-full bg-[var(--color-login-kicker-bg)] px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-accent-strong">
                Calm finance system
              </span>
              <div className="grid gap-2">
                <h1>
                  <Link
                    href="/login"
                    className="bg-[var(--gradient-login-title)] bg-clip-text text-[clamp(2.8rem,2.2rem+2vw,4.25rem)] font-extrabold leading-[0.9] tracking-[-0.08em] text-transparent"
                  >
                    DuitFlow
                  </Link>
                </h1>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <FeaturePill title="Quick entry" />
              <FeaturePill title="Clear balance" />
              <FeaturePill title="Budget focus" />
            </div>
          </div>

          <div className="grid content-center gap-6 bg-surface-1 p-6 lg:p-9">
            <div className="grid gap-2.5">
              <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-text-3">
                {eyebrow}
              </span>
              <h2 className="text-[clamp(1.8rem,1.5rem+0.7vw,2.25rem)] font-semibold tracking-[-0.05em]">
                {title}
              </h2>
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

function FeaturePill({
  title,
}: {
  title: string;
}) {
  return (
    <div className="grid rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle/80 bg-[color:hsla(0,0%,100%,0.42)] p-4 backdrop-blur-sm dark:bg-[color:hsla(156,14%,12%,0.28)]">
      <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">{title}</strong>
    </div>
  );
}
