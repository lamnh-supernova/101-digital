import type { ReactNode } from 'react';

import { SidebarNav } from './sidebar-nav';

export interface AppShellProps {
  readonly children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-white lg:flex">
      <a
        className="focus:ring-primary-600 sr-only z-50 rounded-md bg-white px-4 py-3 font-semibold text-neutral-950 shadow-lg focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:ring-2 focus:outline-none"
        href="#main-content"
      >
        Skip to main content
      </a>

      <SidebarNav />

      <main
        className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 py-8 outline-none sm:px-6 sm:py-10 lg:px-10 lg:py-12"
        id="main-content"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}
