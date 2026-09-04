import { z } from 'zod';

import { isCanonicalDate } from './invoice-query.schema';

const requiredText = (label: string, maximum: number) =>
  z
    .string({ error: `${label} is required.` })
    .min(1, `${label} is required.`)
    .max(maximum, `${label} must be ${maximum} characters or fewer.`)
    .refine((value) => value.trim().length > 0, `${label} is required.`);

const optionalText = (maximum: number) => z.string().max(maximum);

export const createInvoiceFormSchema = z
  .object({
    customer: z.object({
      fullname: requiredText('Customer name', 150),
      email: z
        .string({ error: 'Enter a valid email address.' })
        .email('Enter a valid email address.')
        .max(254),
      mobileNumber: optionalText(30),
      address: optionalText(250),
    }),
    invoiceNumber: requiredText('Invoice number', 50),
    invoiceReference: optionalText(100),
    invoiceDate: z.string().refine(isCanonicalDate, 'Enter a valid invoice date.'),
    dueDate: z.string().refine(isCanonicalDate, 'Enter a valid due date.'),
    currency: z
      .string()
      .regex(/^[A-Za-z]{3}$/, 'Use a three-letter currency code.')
      .transform((value) => value.toUpperCase()),
    description: optionalText(1_000),
    item: z.object({
      name: requiredText('Item name', 150),
      quantity: z
        .number({ error: 'Enter a valid quantity.' })
        .int('Quantity must be a whole number.')
        .positive('Quantity must be greater than zero.')
        .max(100_000),
      rate: z
        .number({ error: 'Enter a valid rate.' })
        .positive('Rate must be greater than zero.')
        .max(10_000_000),
    }),
    taxPercent: z
      .number({ error: 'Enter a valid tax percentage.' })
      .min(0, 'Tax must be zero or more.')
      .max(100, 'Tax must be 100 or less.'),
    discount: z
      .number({ error: 'Enter a valid discount.' })
      .min(0, 'Discount must be zero or more.')
      .max(10_000_000, 'Discount is too large.'),
  })
  .strict()
  .superRefine((values, context) => {
    if (values.invoiceDate > values.dueDate) {
      context.addIssue({
        code: 'custom',
        message: 'Due date must be on or after the invoice date.',
        path: ['dueDate'],
      });
    }
  });

export type CreateInvoiceFormValues = z.output<typeof createInvoiceFormSchema>;
