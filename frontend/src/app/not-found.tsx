import type { Metadata } from 'next';
import Link from 'next/link';

import { EmptyState } from '@/components/ui/feedback-state';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <EmptyState
      action={
        <Link
          className="focus-visible:ring-primary-600 inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          href="/"
        >
          Return home
        </Link>
      }
      description="The address may be incorrect, or the page may have moved."
      headingLevel={1}
      title="Page not found"
    />
  );
}
