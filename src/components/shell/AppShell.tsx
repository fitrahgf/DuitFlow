"use client";

import type { ReactNode } from "react";
import { PageContainer, type PageContainerProps } from "@/components/shared/PagePrimitives";

interface AppShellProps {
  sidebar: ReactNode;
  header?: ReactNode;
  mobileNav?: ReactNode;
  overlays?: ReactNode;
  contentSize?: PageContainerProps["size"];
  children: ReactNode;
}

export default function AppShell({
  sidebar,
  header,
  mobileNav,
  overlays,
  contentSize = "default",
  children,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-canvas md:grid md:grid-cols-[4.4rem_minmax(0,1fr)] lg:grid-cols-[var(--sidebar-width)_minmax(0,1fr)]">
      {sidebar}

      <main className="min-w-0">
        {header}
        <PageContainer
          align="responsive"
          padding="page"
          size={contentSize}
          className="relative"
        >
          {children}
        </PageContainer>
      </main>

      {mobileNav}
      {overlays}
    </div>
  );
}
