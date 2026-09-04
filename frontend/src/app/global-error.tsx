'use client';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/feedback-state';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <head>
        <title>Application unavailable | SimpleInvoice</title>
      </head>
      <body className="min-h-screen bg-neutral-50 text-neutral-950">
        <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 sm:px-6">
          <ErrorState
            action={<Button onClick={reset}>Try again</Button>}
            description="SimpleInvoice could not start correctly. Try again, or return later if the problem continues."
            headingLevel={1}
            title="The application is unavailable"
          />
        </main>
      </body>
    </html>
  );
}
