import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateInvoiceDto } from './create-invoice.dto';

function buildDto(overrides: Record<string, unknown> = {}): CreateInvoiceDto {
  return plainToInstance(CreateInvoiceDto, {
    customer: { fullname: 'Alex Morgan', email: 'alex@example.test' },
    invoiceNumber: 'INV-1',
    invoiceDate: '2026-01-10',
    dueDate: '2026-01-20',
    currency: 'GBP',
    item: { name: 'Consulting', quantity: 1, rate: 100 },
    ...overrides,
  });
}

describe('CreateInvoiceDto validation', () => {
  it('accepts a fully valid payload', async () => {
    const errors = await validate(buildDto());
    expect(errors).toHaveLength(0);
  });

  it('accepts a due date equal to the invoice date', async () => {
    const errors = await validate(buildDto({ invoiceDate: '2026-01-10', dueDate: '2026-01-10' }));
    expect(errors).toHaveLength(0);
  });

  it('rejects a due date earlier than the invoice date, with the documented message', async () => {
    const errors = await validate(buildDto({ invoiceDate: '2026-01-20', dueDate: '2026-01-10' }));
    const dueDateError = errors.find((error) => error.property === 'dueDate');

    expect(dueDateError).toBeDefined();
    expect(Object.values(dueDateError?.constraints ?? {})).toContain(
      'dueDate must be on or after invoiceDate',
    );
  });

  it('rejects an invalid customer email', async () => {
    const errors = await validate(
      buildDto({ customer: { fullname: 'Alex', email: 'not-an-email' } }),
    );
    expect(errors.some((error) => error.property === 'customer')).toBe(true);
  });

  it('rejects a non-positive item quantity or rate', async () => {
    const errors = await validate(
      buildDto({ item: { name: 'Consulting', quantity: 0, rate: -5 } }),
    );
    expect(errors.some((error) => error.property === 'item')).toBe(true);
  });

  it('rejects a currency code that is not three letters', async () => {
    const errors = await validate(buildDto({ currency: 'GB' }));
    expect(errors.some((error) => error.property === 'currency')).toBe(true);
  });
});
