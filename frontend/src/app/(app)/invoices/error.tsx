'use client';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/feedback-state';

type InvoiceErrorProps = {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
};

export default function InvoiceError({ reset }: InvoiceErrorProps) {
  return (
    <ErrorState
      action={<Button onClick={reset}>Try again</Button>}
      description="The invoice page could not be prepared. No invoice data was displayed."
      headingLevel={1}
      title="Invoices could not be loaded"
    />
  );
}
