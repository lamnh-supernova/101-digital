/** Persisted statuses. "Overdue" is derived at read time and never stored. */
export enum InvoiceStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  PAID = 'Paid',
}

export type DisplayInvoiceStatus = InvoiceStatus | 'Overdue';

export const FILTERABLE_STATUSES = [
  InvoiceStatus.DRAFT,
  InvoiceStatus.PENDING,
  InvoiceStatus.PAID,
  'Overdue',
] as const;
