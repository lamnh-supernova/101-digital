import {
  DEFAULT_INVOICE_QUERY,
  invoiceQueryHref,
  isCanonicalDate,
  parseInvoiceSearchParams,
  urlSearchParamsToRecord,
  withInvoiceQuery,
} from './invoice-query.schema';

describe('isCanonicalDate', () => {
  it('accepts a real calendar date', () => {
    expect(isCanonicalDate('2026-01-10')).toBe(true);
  });

  it('rejects an out-of-range or malformed date', () => {
    expect(isCanonicalDate('2026-02-30')).toBe(false);
    expect(isCanonicalDate('not-a-date')).toBe(false);
  });
});

describe('parseInvoiceSearchParams', () => {
  it('returns defaults for an empty input with no redirect', () => {
    const parsed = parseInvoiceSearchParams({});

    expect(parsed.query).toEqual(DEFAULT_INVOICE_QUERY);
    expect(parsed.shouldRedirect).toBe(false);
    expect(parsed.canonicalHref).toBe('/invoices');
  });

  it('canonicalizes a non-canonical but valid input and requests a redirect', () => {
    const parsed = parseInvoiceSearchParams({ page: '01' });

    expect(parsed.query.page).toBe(1);
    expect(parsed.shouldRedirect).toBe(true);
  });

  it('drops an out-of-enum status or sort field rather than throwing', () => {
    const parsed = parseInvoiceSearchParams({ status: 'NotAStatus', sortBy: 'invoiceId' });

    expect(parsed.query.status).toBeUndefined();
    expect(parsed.query.sortBy).toBe('invoiceDate');
  });

  it('drops an inverted from/to date range', () => {
    const parsed = parseInvoiceSearchParams({ fromDate: '2026-02-01', toDate: '2026-01-01' });

    expect(parsed.query.fromDate).toBeUndefined();
    expect(parsed.query.toDate).toBeUndefined();
  });

  it('accepts each documented filter status', () => {
    for (const status of ['Draft', 'Pending', 'Paid', 'Overdue']) {
      expect(parseInvoiceSearchParams({ status }).query.status).toBe(status);
    }
  });
});

describe('withInvoiceQuery / invoiceQueryHref', () => {
  it('resets the page when requested and clears an explicitly-undefined field', () => {
    const next = withInvoiceQuery(
      { ...DEFAULT_INVOICE_QUERY, page: 3, selected: 'INV-1' },
      { selected: undefined },
      true,
    );

    expect(next.page).toBe(1);
    expect(next.selected).toBeUndefined();
  });

  it('serializes only non-default fields into the href', () => {
    expect(invoiceQueryHref(DEFAULT_INVOICE_QUERY)).toBe('/invoices');
    expect(invoiceQueryHref({ ...DEFAULT_INVOICE_QUERY, keyword: 'INV-002' })).toBe(
      '/invoices?keyword=INV-002',
    );
  });
});

describe('urlSearchParamsToRecord', () => {
  it('collapses a single value but preserves repeats as an array', () => {
    const params = new URLSearchParams('keyword=a&keyword=b&page=2');
    expect(urlSearchParamsToRecord(params)).toEqual({ keyword: ['a', 'b'], page: '2' });
  });
});
