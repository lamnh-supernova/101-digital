export const INVOICE_PAGE_SIZES = [10, 20, 50] as const;
export type InvoicePageSize = (typeof INVOICE_PAGE_SIZES)[number];

export const PERSISTED_STATUSES = ['Draft', 'Pending', 'Paid'] as const;
export type PersistedInvoiceStatus = (typeof PERSISTED_STATUSES)[number];

export const FILTER_STATUSES = ['Draft', 'Pending', 'Paid', 'Overdue'] as const;
export type InvoiceFilterStatus = (typeof FILTER_STATUSES)[number];
export type DisplayInvoiceStatus = InvoiceFilterStatus;

export const SORTABLE_FIELDS = ['invoiceDate', 'dueDate', 'totalAmount'] as const;
export type InvoiceSortField = (typeof SORTABLE_FIELDS)[number];
export type InvoiceSortOrder = 'ASC' | 'DESC';

export interface InvoiceListQuery {
  readonly keyword: string;
  readonly status?: InvoiceFilterStatus;
  readonly fromDate?: string;
  readonly toDate?: string;
  readonly sortBy: InvoiceSortField;
  readonly ordering: InvoiceSortOrder;
  readonly page: number;
  readonly pageSize: InvoicePageSize;
  readonly selected?: string;
}

export interface InvoiceCustomer {
  readonly fullname: string;
  readonly email: string;
  readonly mobileNumber?: string;
  readonly address?: string;
}

export interface InvoiceLineItem {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
  readonly rate: number;
}

export interface Invoice {
  readonly invoiceId: string;
  readonly invoiceNumber: string;
  readonly invoiceReference?: string;
  readonly invoiceDate: string;
  readonly dueDate: string;
  readonly currency: string;
  readonly currencySymbol: string;
  readonly description?: string;
  readonly status: DisplayInvoiceStatus;
  readonly invoiceSubTotal: number;
  readonly totalTax: number;
  readonly totalDiscount: number;
  readonly totalAmount: number;
  readonly totalPaid: number;
  readonly balanceAmount: number;
  readonly customer: InvoiceCustomer;
  readonly items: readonly InvoiceLineItem[];
  readonly createdAt: string;
}

export interface InvoicePagination {
  readonly page: number;
  readonly pageSize: InvoicePageSize;
  readonly total: number;
  readonly totalPages: number;
  readonly hasPrevious: boolean;
  readonly hasNext: boolean;
}

export interface InvoicePage {
  readonly invoices: readonly Invoice[];
  readonly pagination: InvoicePagination;
}

export function toPagination(
  page: number,
  pageSize: InvoicePageSize,
  total: number,
): InvoicePagination {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}
