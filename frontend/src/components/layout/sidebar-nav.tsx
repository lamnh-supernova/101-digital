'use client';

import { FilePlus2, LogOut, Menu, Receipt, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/auth/auth-context';
import { cn } from '@/lib/cn';

function BrandMark() {
  return (
    <Link
      aria-label="SimpleInvoice home"
      className="focus-visible:ring-primary-600 inline-flex items-center gap-2.5 rounded-md font-bold tracking-tight text-neutral-950 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      href="/"
    >
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-md bg-neutral-950 text-xs font-bold tracking-wider text-white"
      >
        SI
      </span>
      <span>SimpleInvoice</span>
    </Link>
  );
}

function navLinkClasses(current: boolean): string {
  return cn(
    'flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary-600',
    current
      ? 'bg-primary-50 text-primary-900'
      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const onCreatePage = pathname === '/invoices/new';

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="flex min-h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden">
        <BrandMark />
        <button
          aria-controls="sidebar-nav"
          aria-expanded={isOpen}
          aria-label="Open menu"
          className="focus-visible:ring-primary-600 grid size-11 place-items-center rounded-md text-neutral-700 outline-none hover:bg-neutral-100 focus-visible:ring-2"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
      </div>

      {isOpen ? (
        <button
          aria-label="Dismiss menu"
          className="fixed inset-0 z-40 bg-neutral-950/30 lg:hidden"
          onClick={() => setIsOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-neutral-200 bg-white transition-transform duration-200',
          'lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        id="sidebar-nav"
      >
        <div className="flex min-h-16 items-center justify-between border-b border-neutral-200 px-5">
          <BrandMark />
          <button
            aria-label="Close menu"
            className="focus-visible:ring-primary-600 grid size-9 place-items-center rounded-md text-neutral-500 outline-none hover:bg-neutral-100 focus-visible:ring-2 lg:hidden"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>

        <nav aria-label="Invoice navigation" className="flex-1 space-y-1 px-3 py-5">
          <Link
            aria-current={!onCreatePage ? 'page' : undefined}
            className={navLinkClasses(!onCreatePage)}
            href="/invoices"
            onClick={() => setIsOpen(false)}
          >
            <Receipt aria-hidden="true" className="size-4.5 shrink-0" />
            Invoices
          </Link>
          <Link
            aria-current={onCreatePage ? 'page' : undefined}
            className={navLinkClasses(onCreatePage)}
            href="/invoices/new"
            onClick={() => setIsOpen(false)}
          >
            <FilePlus2 aria-hidden="true" className="size-4.5 shrink-0" />
            New invoice
          </Link>
        </nav>

        <div className="border-t border-neutral-200 p-3">
          <button
            className="focus-visible:ring-primary-600 flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-neutral-600 outline-none hover:bg-neutral-100 hover:text-neutral-950 focus-visible:ring-2"
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            type="button"
          >
            <LogOut aria-hidden="true" className="size-4.5 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
