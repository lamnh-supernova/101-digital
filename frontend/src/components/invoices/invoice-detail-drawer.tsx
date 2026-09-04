'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useAuth } from '@/components/auth/auth-context';
import { ErrorState, LoadingState } from '@/components/ui/feedback-state';
import type { Invoice } from '@/domain/invoice-models';
import { ApiError, apiRequest } from '@/lib/api-client';
import { formatCurrency } from '@/lib/format-currency';
import { EMPTY_FORMATTED_VALUE, formatDate, formatDateTime } from '@/lib/format-date';

export interface InvoiceDetailDrawerProps {
  readonly invoiceId: string;
  readonly closeHref: string;
}

type FetchState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly invoice: Invoice };

function DetailValue({ children }: { readonly children: ReactNode }) {
  return <dd className="mt-1 min-w-0 text-sm font-medium break-all text-neutral-950">{children}</dd>;
}

export function InvoiceDetailDrawer({ invoiceId, closeHref }: InvoiceDetailDrawerProps) {
  const router = useRouter();
  const { accessToken, logout } = useAuth();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [state, setState] = useState<FetchState>({ status: 'loading' });

  const closeDetail = useCallback(() => {
    const targets = Array.from(document.querySelectorAll('[data-invoice-view]')).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element.dataset.invoiceView === invoiceId,
    );
    const visibleTarget =
      targets.find((target) => target.getClientRects().length > 0) ?? targets[0];

    visibleTarget?.focus();
    router.replace(closeHref, { scroll: false });
  }, [closeHref, invoiceId, router]);

  useEffect(() => {
    let cancelled = false;
    // Resets to loading whenever invoiceId changes, before the fetch below settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: 'loading' });

    apiRequest<Invoice>(`/invoices/${invoiceId}`, { token: accessToken })
      .then((invoice) => {
        if (!cancelled) setState({ status: 'success', invoice });
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        if (error instanceof ApiError && error.status === 401) {
          logout();
          router.replace('/login');
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          setState({ status: 'error', message: 'This invoice could not be found.' });
          return;
        }

        setState({ status: 'error', message: 'The invoice details could not be loaded.' });
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, invoiceId, logout, router]);

  useEffect(() => {
    if (state.status === 'success') {
      headingRef.current?.focus();
    }
  }, [state.status]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeDetail();
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [closeDetail]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40">
      <button
        aria-label="Close invoice details"
        className="absolute inset-0 bg-neutral-950/30"
        onClick={closeDetail}
        type="button"
      />
      <section
        aria-labelledby="invoice-detail-heading"
        aria-modal="true"
        className="animate-slide-in absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-xl motion-reduce:animate-none"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 p-5 sm:p-6">
          <div>
            <p className="text-primary-700 text-xs font-semibold tracking-[0.14em] uppercase">
              Invoice view
            </p>
            <h2
              className="focus-visible:ring-primary-600 mt-2 rounded-sm text-2xl font-semibold tracking-tight text-neutral-950 outline-none focus-visible:ring-2"
              id="invoice-detail-heading"
              ref={headingRef}
              tabIndex={-1}
            >
              {state.status === 'success' ? state.invoice.invoiceNumber : 'Invoice'}
            </h2>
          </div>
          <Link
            aria-keyshortcuts="Escape"
            className="focus-visible:ring-primary-600 inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            href={closeHref}
            onClick={(event) => {
              event.preventDefault();
              closeDetail();
            }}
          >
            <X aria-hidden="true" className="size-4" />
            Close
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {state.status === 'loading' ? (
            <LoadingState description="Fetching the invoice." title="Loading invoice" />
          ) : null}

          {state.status === 'error' ? (
            <ErrorState description={state.message} title="Could not load this invoice" />
          ) : null}

          {state.status === 'success' ? (
            <div className="grid min-w-0 gap-6">
              <dl className="grid min-w-0 grid-cols-1 gap-4 rounded-lg bg-neutral-50 p-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Reference</dt>
                  <DetailValue>
                    {state.invoice.invoiceReference ?? EMPTY_FORMATTED_VALUE}
                  </DetailValue>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Status</dt>
                  <DetailValue>{state.invoice.status}</DetailValue>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Invoice date</dt>
                  <DetailValue>{formatDate(state.invoice.invoiceDate)}</DetailValue>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Due date</dt>
                  <DetailValue>{formatDate(state.invoice.dueDate)}</DetailValue>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Created</dt>
                  <DetailValue>{formatDateTime(state.invoice.createdAt)}</DetailValue>
                </div>
              </dl>

              <dl className="grid min-w-0 gap-4 rounded-lg bg-neutral-50 p-4">
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Customer</dt>
                  <DetailValue>{state.invoice.customer.fullname}</DetailValue>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Email</dt>
                  <DetailValue>{state.invoice.customer.email}</DetailValue>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Mobile</dt>
                  <DetailValue>
                    {state.invoice.customer.mobileNumber || EMPTY_FORMATTED_VALUE}
                  </DetailValue>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Address</dt>
                  <DetailValue>
                    {state.invoice.customer.address || EMPTY_FORMATTED_VALUE}
                  </DetailValue>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-neutral-500 uppercase">Description</dt>
                  <DetailValue>{state.invoice.description || EMPTY_FORMATTED_VALUE}</DetailValue>
                </div>
              </dl>

              <dl className="min-w-0 rounded-lg bg-neutral-50 p-4">
                <div className="grid min-w-0 grid-cols-2 gap-4">
                  {state.invoice.items.map((item) => (
                    <div className="col-span-2 grid grid-cols-2 gap-4 sm:grid-cols-4" key={item.id}>
                      <div className="col-span-2 sm:col-span-1">
                        <dt className="text-xs font-semibold text-neutral-500 uppercase">Item</dt>
                        <DetailValue>{item.name}</DetailValue>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-neutral-500 uppercase">Quantity</dt>
                        <DetailValue>{item.quantity}</DetailValue>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-neutral-500 uppercase">Rate</dt>
                        <DetailValue>
                          {formatCurrency(item.rate, state.invoice.currency)}
                        </DetailValue>
                      </div>
                    </div>
                  ))}
                </div>
              </dl>

              <dl className="min-w-0 rounded-lg bg-neutral-950 p-4 text-white">
                <div className="grid min-w-0 grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-neutral-400 uppercase">Subtotal</dt>
                    <dd className="mt-1 text-sm font-semibold break-words">
                      {formatCurrency(state.invoice.invoiceSubTotal, state.invoice.currency)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-neutral-400 uppercase">Tax</dt>
                    <dd className="mt-1 text-sm font-semibold break-words">
                      {formatCurrency(state.invoice.totalTax, state.invoice.currency)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-neutral-400 uppercase">Discount</dt>
                    <dd className="mt-1 text-sm font-semibold break-words">
                      {formatCurrency(state.invoice.totalDiscount, state.invoice.currency)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-neutral-400 uppercase">Total</dt>
                    <dd className="mt-1 text-base font-bold break-words">
                      {formatCurrency(state.invoice.totalAmount, state.invoice.currency)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold text-neutral-400 uppercase">Paid</dt>
                    <dd className="mt-1 text-sm font-semibold break-words">
                      {formatCurrency(state.invoice.totalPaid, state.invoice.currency)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-primary-200 text-xs font-semibold uppercase">
                      Balance due
                    </dt>
                    <dd className="mt-1 text-base font-bold break-words">
                      {formatCurrency(state.invoice.balanceAmount, state.invoice.currency)}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
