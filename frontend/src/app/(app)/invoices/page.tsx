'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import { useAuth } from '@/components/auth/auth-context';
import { InvoiceCards } from '@/components/invoices/invoice-cards';
import { InvoiceDetailDrawer } from '@/components/invoices/invoice-detail-drawer';
import { InvoiceFilters } from '@/components/invoices/invoice-filters';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import { RetryButton } from '@/components/invoices/retry-button';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/feedback-state';
import {
  toPagination,
  type Invoice,
  type InvoiceListQuery,
  type InvoicePage as InvoicePageData,
} from '@/domain/invoice-models';
import { ApiError, apiRequest } from '@/lib/api-client';
import { useDocumentTitle } from '@/lib/use-document-title';
import {
  invoiceQueryHref,
  parseInvoiceSearchParams,
  urlSearchParamsToRecord,
  withInvoiceQuery,
} from '@/validation/invoice-query.schema';

interface InvoiceListResponse {
  readonly data: readonly Invoice[];
  readonly paging: { readonly page: number; readonly pageSize: number; readonly total: number };
}

type FetchState =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly page: InvoicePageData };

function hasFilters(query: InvoiceListQuery): boolean {
  return (
    query.keyword !== '' ||
    query.status !== undefined ||
    query.fromDate !== undefined ||
    query.toDate !== undefined
  );
}

function PageJumpForm({
  page,
  query,
}: {
  readonly page: InvoicePageData;
  readonly query: InvoiceListQuery;
}) {
  const router = useRouter();
  const { page: currentPage, totalPages } = page.pagination;

  if (totalPages <= 1) {
    return null;
  }

  function goToPage(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const raw = Number(new FormData(event.currentTarget).get('page'));

    if (!Number.isFinite(raw)) {
      return;
    }

    const target = Math.min(Math.max(Math.trunc(raw), 1), totalPages);

    if (target === currentPage) {
      return;
    }

    const nextQuery = withInvoiceQuery(query, { page: target, selected: undefined }, false);
    router.push(invoiceQueryHref(nextQuery), { scroll: false });
  }

  return (
    <form className="flex items-center gap-2" onSubmit={goToPage}>
      <label className="text-sm text-neutral-600" htmlFor="page-jump-input">
        Go to page
      </label>
      <input
        aria-label={`Go to page, 1 through ${totalPages}`}
        className="w-16 rounded-md border border-neutral-300 bg-white px-2 py-2 text-center text-sm text-neutral-950 shadow-sm outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20"
        defaultValue={currentPage}
        id="page-jump-input"
        key={currentPage}
        max={totalPages}
        min={1}
        name="page"
        type="number"
      />
      <Button className="min-h-11 px-3 py-2 text-sm" type="submit" variant="secondary">
        Go
      </Button>
    </form>
  );
}

function Pagination({
  page,
  query,
}: {
  readonly page: InvoicePageData;
  readonly query: InvoiceListQuery;
}) {
  const previousQuery = withInvoiceQuery(
    query,
    { page: Math.max(1, page.pagination.page - 1), selected: undefined },
    false,
  );
  const nextQuery = withInvoiceQuery(
    query,
    { page: page.pagination.page + 1, selected: undefined },
    false,
  );

  return (
    <nav
      aria-label="Invoice pagination"
      className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-5"
    >
      <div aria-live="polite" className="text-sm text-neutral-600">
        <p>
          Page{' '}
          <strong aria-current="page" className="text-neutral-950">
            {page.pagination.page}
          </strong>{' '}
          of {page.pagination.totalPages}
        </p>
        <p className="mt-1 text-xs">{page.pagination.total} invoices in total</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <PageJumpForm page={page} query={query} />
        {page.pagination.hasPrevious ? (
          <Link
            aria-label={`Previous page, page ${page.pagination.page - 1}`}
            className="focus-visible:ring-primary-600 inline-flex min-h-11 items-center rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            href={invoiceQueryHref(previousQuery)}
          >
            Previous
          </Link>
        ) : (
          <span
            aria-disabled="true"
            aria-label="Previous page unavailable"
            className="inline-flex min-h-11 items-center rounded-md border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-400"
          >
            Previous
          </span>
        )}
        {page.pagination.hasNext ? (
          <Link
            aria-label={`Next page, page ${page.pagination.page + 1}`}
            className="focus-visible:ring-primary-600 inline-flex min-h-11 items-center rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            href={invoiceQueryHref(nextQuery)}
          >
            Next
          </Link>
        ) : (
          <span
            aria-disabled="true"
            aria-label="Next page unavailable"
            className="inline-flex min-h-11 items-center rounded-md bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-400"
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}

function InvoicesPageContent() {
  useDocumentTitle('Invoices');
  const router = useRouter();
  const rawSearchParams = useSearchParams();
  const { accessToken, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<FetchState>({ status: 'loading' });
  const lastFetchedKeyRef = useRef<string>(undefined);

  const parsed = useMemo(
    () => parseInvoiceSearchParams(urlSearchParamsToRecord(rawSearchParams)),
    [rawSearchParams],
  );
  // Detail is fetched independently by id (see InvoiceDetailDrawer), so
  // opening or closing it must not re-fetch or remount the list — doing so
  // would drop the focus restoration this component (below) depends on.
  // This string is stable across selected-only changes, which is what lets
  // it safely gate the fetch effect's dependency array.
  const listQueryHref = useMemo(
    () => invoiceQueryHref(withInvoiceQuery(parsed.query, { selected: undefined }, false)),
    [parsed],
  );

  useEffect(() => {
    if (parsed.shouldRedirect) {
      router.replace(parsed.canonicalHref);
    }
  }, [parsed, router]);

  const fetchKey = `${listQueryHref}::${refreshKey}`;

  useEffect(() => {
    if (parsed.shouldRedirect) {
      return;
    }

    if (lastFetchedKeyRef.current === fetchKey) {
      // Only `selected` changed (opening/closing the detail drawer); the
      // list itself is unaffected, so skip the redundant re-fetch.
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    apiRequest<InvoiceListResponse>('/invoices', {
      token: accessToken,
      searchParams: {
        page: parsed.query.page,
        pageSize: parsed.query.pageSize,
        sortBy: parsed.query.sortBy,
        ordering: parsed.query.ordering,
        status: parsed.query.status,
        keyword: parsed.query.keyword === '' ? undefined : parsed.query.keyword,
        fromDate: parsed.query.fromDate,
        toDate: parsed.query.toDate,
      },
    })
      .then((response) => {
        if (cancelled) return;
        // Marked only on success (never before the request starts): if this
        // attempt is cancelled — e.g. React Strict Mode's dev-only mount,
        // cleanup, remount replay — the next effect run must still retry
        // rather than seeing a stale "already handled" key and skipping it.
        lastFetchedKeyRef.current = fetchKey;
        setState({
          status: 'success',
          page: {
            invoices: response.data,
            pagination: toPagination(
              response.paging.page,
              parsed.query.pageSize,
              response.paging.total,
            ),
          },
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        if (error instanceof ApiError && error.status === 401) {
          logout();
          router.replace('/login');
          return;
        }

        setState({
          status: 'error',
          message:
            error instanceof ApiError
              ? error.message
              : 'The invoice service is temporarily unavailable. Try again in a moment.',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, fetchKey, logout, parsed, router]);

  const closeDetailHref = listQueryHref;

  return (
    <section aria-labelledby="invoices-heading">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary-700 text-sm font-semibold tracking-[0.14em] uppercase">
            Workspace
          </p>
          <h1
            className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl"
            id="invoices-heading"
          >
            Invoices
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">
            Search, filter, sort, view, and page through invoices.
          </p>
        </div>
        <Link
          className="focus-visible:ring-primary-600 inline-flex min-h-11 items-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm outline-none hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-offset-2"
          href="/invoices/new"
        >
          New invoice
        </Link>
      </div>

      <div className="mt-7">
        <InvoiceFilters key={parsed.canonicalHref} query={parsed.query} />
      </div>

      {parsed.query.selected !== undefined ? (
        <InvoiceDetailDrawer closeHref={closeDetailHref} invoiceId={parsed.query.selected} />
      ) : null}

      {state.status === 'loading' ? (
        <div className="mt-8">
          <LoadingState description="Fetching the latest invoices." title="Loading invoices" />
        </div>
      ) : null}

      {state.status === 'error' ? (
        <div className="mt-8">
          <ErrorState
            action={<RetryButton onRetry={() => setRefreshKey((key) => key + 1)} />}
            description={state.message}
            title="Invoices could not be loaded"
          />
        </div>
      ) : null}

      {state.status === 'success' && state.page.invoices.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            action={
              hasFilters(parsed.query) ? (
                <Link
                  className="focus-visible:ring-primary-600 inline-flex min-h-11 items-center rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  href="/invoices"
                >
                  Clear all filters
                </Link>
              ) : undefined
            }
            description={
              hasFilters(parsed.query)
                ? 'No invoices match the current search and filters.'
                : 'No invoices exist yet.'
            }
            title={hasFilters(parsed.query) ? 'No matching invoices' : 'No invoices yet'}
          />
        </div>
      ) : null}

      {state.status === 'success' && state.page.invoices.length > 0 ? (
        <section aria-labelledby="invoice-results-heading" className="mt-8">
          <h2
            className="text-xl font-semibold tracking-tight text-neutral-950"
            id="invoice-results-heading"
          >
            Invoice results
          </h2>
          <p className="mt-1 text-sm text-neutral-600" role="status">
            Showing {state.page.invoices.length}{' '}
            {state.page.invoices.length === 1 ? 'invoice' : 'invoices'} on this page.
          </p>

          <div className="mt-5">
            <InvoiceTable page={state.page} query={parsed.query} />
            <InvoiceCards page={state.page} query={parsed.query} />
          </div>

          <Pagination page={state.page} query={parsed.query} />
        </section>
      ) : null}
    </section>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<LoadingState description="Preparing invoices." title="Loading" />}>
      <InvoicesPageContent />
    </Suspense>
  );
}
