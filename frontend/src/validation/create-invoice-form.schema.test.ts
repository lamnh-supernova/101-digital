import {
  createInvoiceFormSchema,
  type CreateInvoiceFormValues,
} from './create-invoice-form.schema';

const validValues = {
  customer: {
    fullname: 'Alex Morgan',
    email: 'alex@example.test',
    mobileNumber: '',
    address: '',
  },
  invoiceNumber: 'INV-100',
  invoiceReference: '',
  invoiceDate: '2026-01-01',
  dueDate: '2026-02-01',
  currency: 'gbp',
  description: '',
  item: { name: 'Consulting', quantity: 2, rate: 125.5 },
  taxPercent: 10,
  discount: 0,
} satisfies Record<string, unknown>;

describe('createInvoiceFormSchema', () => {
  it('accepts a fully valid invoice and uppercases the currency', () => {
    const result = createInvoiceFormSchema.safeParse(validValues);
    expect(result.success).toBe(true);
    expect((result.data as CreateInvoiceFormValues | undefined)?.currency).toBe('GBP');
  });

  it('rejects a blank customer name', () => {
    const result = createInvoiceFormSchema.safeParse({
      ...validValues,
      customer: { ...validValues.customer, fullname: '  ' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid customer email', () => {
    const result = createInvoiceFormSchema.safeParse({
      ...validValues,
      customer: { ...validValues.customer, email: 'not-an-email' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a due date earlier than the invoice date', () => {
    const result = createInvoiceFormSchema.safeParse({
      ...validValues,
      invoiceDate: '2026-02-01',
      dueDate: '2026-01-01',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-positive quantity or rate', () => {
    expect(
      createInvoiceFormSchema.safeParse({
        ...validValues,
        item: { name: 'Consulting', quantity: 0, rate: 10 },
      }).success,
    ).toBe(false);
    expect(
      createInvoiceFormSchema.safeParse({
        ...validValues,
        item: { name: 'Consulting', quantity: 1, rate: -10 },
      }).success,
    ).toBe(false);
  });

  it('rejects a tax percentage above 100', () => {
    const result = createInvoiceFormSchema.safeParse({ ...validValues, taxPercent: 150 });
    expect(result.success).toBe(false);
  });

  it('rejects a currency code that is not three letters', () => {
    const result = createInvoiceFormSchema.safeParse({ ...validValues, currency: 'GB' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown top-level field', () => {
    expect(createInvoiceFormSchema.safeParse({ ...validValues, extra: true }).success).toBe(false);
  });
});
