import { z } from 'zod';

import {
  FILTER_STATUSES,
  INVOICE_PAGE_SIZES,
  SORTABLE_FIELDS,
  type InvoiceListQuery,
} from '@/domain/invoice-models';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type QueryKey =
  | 'keyword'
  | 'status'
  | 'fromDate'
  | 'toDate'
  | 'sortBy'
  | 'ordering'
  | 'page'
  | 'pageSize'
  | 'selected';

export type RawInvoiceSearchParams = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

export const DEFAULT_INVOICE_QUERY: InvoiceListQuery = {
  keyword: '',
  sortBy: 'invoiceDate',
  ordering: 'DESC',
  page: 1,
  pageSize: 10,
};

export function isCanonicalDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);

  if (match === null) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const invoiceQuerySchema = z
  .object({
    keyword: z.string().trim().max(100).default(''),
    status: z.enum(FILTER_STATUSES).optional(),
    fromDate: z.string().refine(isCanonicalDate).optional(),
    toDate: z.string().refine(isCanonicalDate).optional(),
    sortBy: z.enum(SORTABLE_FIELDS).default('invoiceDate'),
    ordering: z.enum(['ASC', 'DESC']).default('DESC'),
    page: z.number().int().min(1).max(10_000).default(1),
    pageSize: z.union([z.literal(10), z.literal(20), z.literal(50)]).default(10),
    selected: z.string().trim().min(1).max(128).optional(),
  })
  .strict();

function readSingle(input: RawInvoiceSearchParams, key: QueryKey): string | undefined {
  const raw = input[key];
  return typeof raw === 'string' ? raw : undefined;
}

function parsePositiveInteger(value: string | undefined, maximum: number): number | undefined {
  if (value === undefined || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : undefined;
}

export function serializeInvoiceQuery(query: InvoiceListQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.keyword !== '') params.set('keyword', query.keyword);
  if (query.status !== undefined) params.set('status', query.status);
  if (query.fromDate !== undefined) params.set('fromDate', query.fromDate);
  if (query.toDate !== undefined) params.set('toDate', query.toDate);
  if (query.sortBy !== DEFAULT_INVOICE_QUERY.sortBy) params.set('sortBy', query.sortBy);
  if (query.ordering !== DEFAULT_INVOICE_QUERY.ordering) params.set('ordering', query.ordering);
  if (query.page !== DEFAULT_INVOICE_QUERY.page) params.set('page', String(query.page));
  if (query.pageSize !== DEFAULT_INVOICE_QUERY.pageSize) {
    params.set('pageSize', String(query.pageSize));
  }
  if (query.selected !== undefined) params.set('selected', query.selected);

  return params;
}

export function invoiceQueryHref(query: InvoiceListQuery): string {
  const search = serializeInvoiceQuery(query).toString();
  return search === '' ? '/invoices' : `/invoices?${search}`;
}

export function withInvoiceQuery(
  query: InvoiceListQuery,
  changes: Partial<InvoiceListQuery>,
  resetPage = false,
): InvoiceListQuery {
  return invoiceQuerySchema.parse({
    ...query,
    ...changes,
    ...(resetPage ? { page: 1 } : {}),
  });
}

export interface ParsedInvoiceSearchParams {
  readonly query: InvoiceListQuery;
  readonly canonicalHref: string;
  readonly shouldRedirect: boolean;
}

function originalSearch(input: RawInvoiceSearchParams): string {
  const params = new URLSearchParams();

  for (const [key, raw] of Object.entries(input)) {
    if (typeof raw === 'string') {
      params.append(key, raw);
      continue;
    }

    for (const value of raw ?? []) {
      params.append(key, value);
    }
  }

  return params.toString();
}

/** Parses raw URL search params into a validated, canonical query, dropping anything unrecognised. */
export function parseInvoiceSearchParams(input: RawInvoiceSearchParams): ParsedInvoiceSearchParams {
  const keyword = readSingle(input, 'keyword')?.trim() ?? '';
  const statusRaw = readSingle(input, 'status');
  const status = FILTER_STATUSES.find((value) => value === statusRaw);
  const fromDateRaw = readSingle(input, 'fromDate');
  const toDateRaw = readSingle(input, 'toDate');
  const fromDate =
    fromDateRaw !== undefined && isCanonicalDate(fromDateRaw) ? fromDateRaw : undefined;
  const toDate = toDateRaw !== undefined && isCanonicalDate(toDateRaw) ? toDateRaw : undefined;
  const invertedDates = fromDate !== undefined && toDate !== undefined && fromDate > toDate;
  const sortByRaw = readSingle(input, 'sortBy');
  const sortBy =
    SORTABLE_FIELDS.find((value) => value === sortByRaw) ?? DEFAULT_INVOICE_QUERY.sortBy;
  const orderingRaw = readSingle(input, 'ordering');
  const ordering =
    orderingRaw === 'ASC' || orderingRaw === 'DESC' ? orderingRaw : DEFAULT_INVOICE_QUERY.ordering;
  const page =
    parsePositiveInteger(readSingle(input, 'page'), 10_000) ?? DEFAULT_INVOICE_QUERY.page;
  const pageSizeNumber = parsePositiveInteger(readSingle(input, 'pageSize'), 50);
  const pageSize =
    INVOICE_PAGE_SIZES.find((value) => value === pageSizeNumber) ?? DEFAULT_INVOICE_QUERY.pageSize;
  const selectedRaw = readSingle(input, 'selected')?.trim();
  const selected =
    selectedRaw !== undefined && selectedRaw !== '' && selectedRaw.length <= 128
      ? selectedRaw
      : undefined;

  const query = invoiceQuerySchema.parse({
    keyword: keyword.length <= 100 ? keyword : '',
    ...(status === undefined ? {} : { status }),
    ...(fromDate === undefined || invertedDates ? {} : { fromDate }),
    ...(toDate === undefined || invertedDates ? {} : { toDate }),
    sortBy,
    ordering,
    page,
    pageSize,
    ...(selected === undefined ? {} : { selected }),
  });
  const canonicalSearch = serializeInvoiceQuery(query).toString();

  return {
    query,
    canonicalHref: canonicalSearch === '' ? '/invoices' : `/invoices?${canonicalSearch}`,
    shouldRedirect: originalSearch(input) !== canonicalSearch,
  };
}

export function urlSearchParamsToRecord(searchParams: URLSearchParams): RawInvoiceSearchParams {
  const result: Record<string, string | readonly string[]> = {};

  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);
    result[key] = values.length === 1 ? (values[0] ?? '') : values;
  }

  return result;
}
