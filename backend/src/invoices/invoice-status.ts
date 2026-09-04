import { InvoiceStatus, type DisplayInvoiceStatus } from './entities/invoice-status.enum';

function dateOnlyUtc(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/**
 * Overdue is derived at read time and never persisted:
 * if status != "Paid" AND dueDate < today -> "Overdue", otherwise the persisted status.
 */
export function deriveDisplayStatus(
  status: InvoiceStatus,
  dueDate: string,
  today: Date = new Date(),
): DisplayInvoiceStatus {
  if (status === InvoiceStatus.PAID) {
    return status;
  }

  const dueDateValue = dateOnlyUtc(new Date(`${dueDate}T00:00:00.000Z`));
  const todayValue = dateOnlyUtc(today);

  return dueDateValue < todayValue ? 'Overdue' : status;
}
