'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fieldControlClasses, fieldDescribedBy } from '@/components/ui/field';
import {
  FILTER_STATUSES,
  INVOICE_PAGE_SIZES,
  SORTABLE_FIELDS,
  type InvoiceListQuery,
  type InvoiceSortField,
} from '@/domain/invoice-models';
import {
  invoiceQueryHref,
  isCanonicalDate,
  withInvoiceQuery,
} from '@/validation/invoice-query.schema';

export const SEARCH_DEBOUNCE_MS = 350;

export interface InvoiceFiltersProps {
  readonly query: InvoiceListQuery;
}

const SORT_FIELD_LABELS: Readonly<Record<InvoiceSortField, string>> = {
  invoiceDate: 'Invoice date',
  dueDate: 'Due date',
  totalAmount: 'Total amount',
};

function activeFilterCount(query: InvoiceListQuery): number {
  return [query.keyword !== '', query.status !== undefined, query.fromDate, query.toDate].filter(
    Boolean,
  ).length;
}

export function InvoiceFilters({ query }: InvoiceFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [keywordDraft, setKeywordDraft] = useState(query.keyword);
  const [fromDateDraft, setFromDateDraft] = useState(query.fromDate ?? '');
  const [toDateDraft, setToDateDraft] = useState(query.toDate ?? '');
  const [dateError, setDateError] = useState<string>();
  const suppressKeywordNavigation = useRef(false);

  const navigate = useCallback(
    (changes: Partial<InvoiceListQuery>, resetPage = true) => {
      const nextQuery = withInvoiceQuery(query, { ...changes, selected: undefined }, resetPage);

      startTransition(() => {
        router.replace(invoiceQueryHref(nextQuery), { scroll: false });
      });
    },
    [query, router],
  );

  useEffect(() => {
    if (suppressKeywordNavigation.current) {
      suppressKeywordNavigation.current = false;
      return;
    }

    const normalizedKeyword = keywordDraft.trim();

    if (normalizedKeyword === query.keyword) {
      return;
    }

    const timeout = window.setTimeout(() => {
      navigate({ keyword: normalizedKeyword });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [keywordDraft, navigate, query.keyword]);

  function applyDates(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const normalizedFromDate = fromDateDraft === '' ? undefined : fromDateDraft;
    const normalizedToDate = toDateDraft === '' ? undefined : toDateDraft;

    if (
      (normalizedFromDate !== undefined && !isCanonicalDate(normalizedFromDate)) ||
      (normalizedToDate !== undefined && !isCanonicalDate(normalizedToDate))
    ) {
      setDateError('Enter valid dates.');
      return;
    }

    if (
      normalizedFromDate !== undefined &&
      normalizedToDate !== undefined &&
      normalizedFromDate > normalizedToDate
    ) {
      setDateError('The from date must not be after the to date.');
      return;
    }

    setDateError(undefined);
    navigate({ fromDate: normalizedFromDate, toDate: normalizedToDate });
  }

  function clearFilters(): void {
    suppressKeywordNavigation.current = true;
    setKeywordDraft('');
    setFromDateDraft('');
    setToDateDraft('');
    setDateError(undefined);
    navigate({ keyword: '', status: undefined, fromDate: undefined, toDate: undefined });
  }

  const filters = activeFilterCount(query);

  return (
    <Card aria-busy={isPending} aria-labelledby="invoice-filters-heading" className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-neutral-950" id="invoice-filters-heading">
            Find invoices
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Search updates after a short pause. Other changes apply immediately or on request.
          </p>
        </div>
        <span className="bg-primary-50 text-primary-800 rounded-full px-3 py-1 text-xs font-semibold">
          {filters} active {filters === 1 ? 'filter' : 'filters'}
        </span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="text-sm font-semibold text-neutral-800" htmlFor="invoice-keyword">
            Search invoice number or customer
          </label>
          <input
            autoComplete="off"
            className={fieldControlClasses}
            id="invoice-keyword"
            maxLength={100}
            onChange={(event) => setKeywordDraft(event.target.value)}
            placeholder="For example, IV1000 or Alex Morgan"
            type="search"
            value={keywordDraft}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-neutral-800" htmlFor="invoice-status">
            Status
          </label>
          <select
            className={fieldControlClasses}
            id="invoice-status"
            onChange={(event) => {
              const status = FILTER_STATUSES.find((candidate) => candidate === event.target.value);
              navigate({ status });
            }}
            value={query.status ?? ''}
          >
            <option value="">All statuses</option>
            {FILTER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-neutral-800" htmlFor="invoice-sort-by">
            Sort by
          </label>
          <select
            className={fieldControlClasses}
            id="invoice-sort-by"
            onChange={(event) => {
              const sortBy = SORTABLE_FIELDS.find((candidate) => candidate === event.target.value);
              if (sortBy) navigate({ sortBy });
            }}
            value={query.sortBy}
          >
            {SORTABLE_FIELDS.map((field) => (
              <option key={field} value={field}>
                {SORT_FIELD_LABELS[field]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" onSubmit={applyDates}>
        <div>
          <label className="text-sm font-semibold text-neutral-800" htmlFor="invoice-from-date">
            From date
          </label>
          <input
            aria-describedby={fieldDescribedBy('invoice-date', { error: dateError })}
            aria-invalid={dateError ? 'true' : 'false'}
            className={fieldControlClasses}
            id="invoice-from-date"
            onChange={(event) => setFromDateDraft(event.target.value)}
            type="date"
            value={fromDateDraft}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-neutral-800" htmlFor="invoice-to-date">
            To date
          </label>
          <input
            aria-describedby={fieldDescribedBy('invoice-date', { error: dateError })}
            aria-invalid={dateError ? 'true' : 'false'}
            className={fieldControlClasses}
            id="invoice-to-date"
            onChange={(event) => setToDateDraft(event.target.value)}
            type="date"
            value={toDateDraft}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-neutral-800" htmlFor="invoice-order">
            Order
          </label>
          <select
            className={fieldControlClasses}
            id="invoice-order"
            onChange={(event) =>
              navigate({ ordering: event.target.value === 'ASC' ? 'ASC' : 'DESC' })
            }
            value={query.ordering}
          >
            <option value="DESC">Newest / highest first</option>
            <option value="ASC">Oldest / lowest first</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-neutral-800" htmlFor="invoice-page-size">
            Invoices per page
          </label>
          <select
            className={fieldControlClasses}
            id="invoice-page-size"
            onChange={(event) => {
              const value = Number(event.target.value);
              const pageSize = INVOICE_PAGE_SIZES.find((candidate) => candidate === value) ?? 10;
              navigate({ pageSize });
            }}
            value={query.pageSize}
          >
            {INVOICE_PAGE_SIZES.map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <Button className="flex-1" type="submit">
            Apply dates
          </Button>
          <Button disabled={filters === 0} onClick={clearFilters} type="button" variant="secondary">
            Clear
          </Button>
        </div>
      </form>

      {dateError ? (
        <p
          className="text-danger-600 mt-3 text-sm font-medium"
          id="invoice-date-error"
          role="alert"
        >
          {dateError}
        </p>
      ) : null}
      <p aria-live="polite" className="sr-only" role="status">
        {isPending ? 'Updating invoices.' : ''}
      </p>
    </Card>
  );
}
