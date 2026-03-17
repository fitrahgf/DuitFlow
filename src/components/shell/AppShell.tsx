"use client";

import type { ReactNode } from "react";
import { PageContainer } from "@/components/shared/PagePrimitives";

interface AppShellProps {
  sidebar: ReactNode;
  header?: ReactNode;
  mobileNav?: ReactNode;
  overlays?: ReactNode;
  children: ReactNode;
}

export default function AppShell({
  sidebar,
  header,
  mobileNav,
  overlays,
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[4.35rem_minmax(0,1fr)] lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)] xl:grid-cols-[calc(var(--sidebar-width)+0.5rem)_minmax(0,1fr)]">
      {sidebar}

      <main className="min-w-0">
        {header}
        <PageContainer align="responsive" padding="page">
          {children}
        </PageContainer>
      </main>

      {mobileNav}
      {overlays}
    </div>
  );
}
