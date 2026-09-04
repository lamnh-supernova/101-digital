import type { Metadata } from 'next';

import { CreateInvoiceForm } from '@/components/invoices/create-invoice-form';

export const metadata: Metadata = { title: 'Create invoice' };

export default function CreateInvoicePage() {
  return (
    <section aria-labelledby="create-invoice-heading">
      <p className="text-primary-700 text-sm font-semibold tracking-[0.14em] uppercase">
        Workspace
      </p>
      <h1
        className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl"
        id="create-invoice-heading"
      >
        Create invoice
      </h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-neutral-600">
        Create one invoice with one line item. Review the calculated summary before sending it
        securely.
      </p>
      <div className="mt-8">
        <CreateInvoiceForm />
      </div>
    </section>
  );
}
