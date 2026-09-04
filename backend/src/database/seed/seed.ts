import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import type { Repository } from 'typeorm';

import { AppModule } from '../../app.module';
import { InvoiceStatus } from '../../invoices/entities/invoice-status.enum';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { calculateInvoiceTotals, currencySymbolFor } from '../../invoices/invoice-money';
import { User } from '../../users/user.entity';

const CUSTOMER_NAMES = [
  'Paul Tan',
  'Mei Lin Ho',
  'Ahmad Faisal',
  'Sarah Connor',
  "Liam O'Brien",
  'Priya Patel',
  'Chen Wei',
  'Grace Kim',
  'Omar Hassan',
  'Isabella Rossi',
  'Noah Muller',
  'Aiko Tanaka',
  'Fatima Zahra',
  'Lucas Silva',
  'Emma Johansson',
];

const ITEM_NAMES = [
  'Consulting services',
  'Web development',
  'Cloud hosting',
  'Design services',
  'Support retainer',
  'Training workshop',
  'Software licence',
  'Maintenance contract',
];

const CURRENCIES = ['GBP', 'USD', 'AUD', 'SGD'];
const STATUSES = [InvoiceStatus.DRAFT, InvoiceStatus.PENDING, InvoiceStatus.PAID];
const INVOICE_COUNT = 32;

function daysFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length] as T;
}

function slugifyEmail(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '');
}

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const configService = app.get(ConfigService);

  try {
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const invoiceRepository = app.get<Repository<Invoice>>(getRepositoryToken(Invoice));

    const seedEmail = configService.get<string>('SEED_USER_EMAIL') as string;
    const seedPassword = configService.get<string>('SEED_USER_PASSWORD') as string;
    const seedFullname = configService.get<string>('SEED_USER_FULLNAME') as string;

    let reviewer = await userRepository.findOne({ where: { email: seedEmail } });

    if (!reviewer) {
      reviewer = await userRepository.save(
        userRepository.create({
          email: seedEmail,
          passwordHash: await bcrypt.hash(seedPassword, 10),
          fullname: seedFullname,
        }),
      );
      // eslint-disable-next-line no-console
      console.log(`Seeded reviewer account: ${seedEmail} / ${seedPassword}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Reviewer account already exists: ${seedEmail}`);
    }

    const existingInvoiceCount = await invoiceRepository.count();

    if (existingInvoiceCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`Invoices already seeded (${existingInvoiceCount} found); skipping.`);
      return;
    }

    for (let index = 0; index < INVOICE_COUNT; index += 1) {
      const status = pick(STATUSES, index);
      // invoiceDate walks into the past; dueDate is always invoiceDate + a
      // positive offset, so older invoices naturally land overdue without
      // ever violating "due date must be on or after invoice date".
      const invoiceDateOffset = -(index * 3);
      const dueDateOffset = invoiceDateOffset + (7 + (index % 4) * 7);
      const invoiceDate = daysFromNow(invoiceDateOffset);
      const dueDate = daysFromNow(dueDateOffset);
      const quantity = 1 + (index % 5);
      const rate = 50 + (index % 12) * 37.5;
      const discount = index % 4 === 0 ? 15 : 0;
      const taxPercent = 10;
      const totals = calculateInvoiceTotals({ quantity, rate, taxPercent, discount });
      const totalPaid = status === InvoiceStatus.PAID ? totals.totalAmount : 0;
      const currency = pick(CURRENCIES, index);
      const customerFullname = pick(CUSTOMER_NAMES, index);

      await invoiceRepository.save(
        invoiceRepository.create({
          invoiceNumber: `IV${1000 + index}`,
          invoiceReference: `#REF-${5000 + index}`,
          invoiceDate,
          dueDate,
          currency,
          currencySymbol: currencySymbolFor(currency),
          description: `Invoice for ${pick(ITEM_NAMES, index).toLowerCase()}`,
          status,
          invoiceSubTotal: totals.subTotal,
          totalTax: totals.taxAmount,
          totalDiscount: totals.discountAmount,
          totalAmount: totals.totalAmount,
          totalPaid,
          balanceAmount: totals.totalAmount - totalPaid,
          customerFullname,
          customerEmail: `${slugifyEmail(customerFullname)}@example.test`,
          customerMobileNumber: `+65900${(1000 + index).toString().slice(-4)}`,
          customerAddress: 'Singapore',
          createdBy: reviewer.id,
          items: [{ name: pick(ITEM_NAMES, index), quantity, rate }],
        }),
      );
    }

    // eslint-disable-next-line no-console
    console.log(`Seeded ${INVOICE_COUNT} invoices.`);
  } finally {
    await app.close();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
