import { InvoiceStatus } from './entities/invoice-status.enum';
import { deriveDisplayStatus } from './invoice-status';

describe('deriveDisplayStatus', () => {
  const today = new Date('2026-06-15T12:00:00.000Z');

  it('shows Overdue when a non-Paid invoice is past its due date', () => {
    expect(deriveDisplayStatus(InvoiceStatus.PENDING, '2026-06-01', today)).toBe('Overdue');
    expect(deriveDisplayStatus(InvoiceStatus.DRAFT, '2026-06-14', today)).toBe('Overdue');
  });

  it('keeps the persisted status when the due date has not passed', () => {
    expect(deriveDisplayStatus(InvoiceStatus.PENDING, '2026-06-15', today)).toBe(
      InvoiceStatus.PENDING,
    );
    expect(deriveDisplayStatus(InvoiceStatus.DRAFT, '2026-06-20', today)).toBe(InvoiceStatus.DRAFT);
  });

  it('never derives Overdue for a Paid invoice, even past its due date', () => {
    expect(deriveDisplayStatus(InvoiceStatus.PAID, '2026-01-01', today)).toBe(InvoiceStatus.PAID);
  });

  it('treats the due date itself as not yet overdue', () => {
    expect(deriveDisplayStatus(InvoiceStatus.PENDING, '2026-06-15', today)).not.toBe('Overdue');
  });
});
