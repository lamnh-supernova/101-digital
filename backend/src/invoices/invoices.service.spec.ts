import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import type { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceStatus } from './entities/invoice-status.enum';
import { Invoice } from './entities/invoice.entity';
import { InvoicesService } from './invoices.service';

interface QueryBuilderCall {
  readonly method: string;
  readonly args: readonly unknown[];
}

interface MockQueryBuilder {
  leftJoinAndSelect: jest.Mock<MockQueryBuilder, unknown[]>;
  andWhere: jest.Mock<MockQueryBuilder, unknown[]>;
  orderBy: jest.Mock<MockQueryBuilder, unknown[]>;
  skip: jest.Mock<MockQueryBuilder, unknown[]>;
  take: jest.Mock<MockQueryBuilder, unknown[]>;
  getManyAndCount: jest.Mock;
}

function createQueryBuilderMock(): {
  queryBuilder: MockQueryBuilder;
  calls: QueryBuilderCall[];
} {
  const calls: QueryBuilderCall[] = [];
  const record =
    (method: string) =>
    (...args: unknown[]): MockQueryBuilder => {
      calls.push({ method, args });
      return queryBuilder;
    };

  const queryBuilder: MockQueryBuilder = {
    leftJoinAndSelect: jest.fn(record('leftJoinAndSelect')),
    andWhere: jest.fn(record('andWhere')),
    orderBy: jest.fn(record('orderBy')),
    skip: jest.fn(record('skip')),
    take: jest.fn(record('take')),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };

  return { queryBuilder, calls };
}

describe('InvoicesService', () => {
  let service: InvoicesService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  // Computed relative to "now" so the derived status stays Draft (not
  // Overdue) no matter when this suite runs.
  const today = new Date().toISOString().slice(0, 10);
  const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const createDto: CreateInvoiceDto = {
    customer: { fullname: 'Alex Morgan', email: 'alex@example.test' },
    invoiceNumber: 'INV-100',
    invoiceDate: today,
    dueDate: inThirtyDays,
    currency: 'gbp',
    item: { name: 'Consulting', quantity: 2, rate: 1000 },
    taxPercent: 10,
    discount: 20,
  } as CreateInvoiceDto;

  beforeEach(async () => {
    repository = {
      create: jest.fn((entity: unknown) => entity),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [InvoicesService, { provide: getRepositoryToken(Invoice), useValue: repository }],
    }).compile();

    service = module.get(InvoicesService);
  });

  describe('create', () => {
    it('computes totals server-side and persists a Draft invoice with an uppercased currency', async () => {
      repository.save.mockImplementation((entity: Record<string, unknown>) =>
        Promise.resolve({
          ...entity,
          invoiceId: 'generated-id',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
      );

      const result = await service.create(createDto, 'user-id');

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: InvoiceStatus.DRAFT,
          currency: 'GBP',
          invoiceSubTotal: 2000,
          totalTax: 200,
          totalDiscount: 20,
          totalAmount: 2180,
          totalPaid: 0,
          balanceAmount: 2180,
          createdBy: 'user-id',
        }),
      );
      expect(result.totalAmount).toBe(2180);
      expect(result.status).toBe(InvoiceStatus.DRAFT);
    });

    it('rejects a duplicate invoice number as a 409 conflict', async () => {
      repository.save.mockRejectedValue({ code: '23505' });

      await expect(service.create(createDto, 'user-id')).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows an unrelated database error unchanged', async () => {
      repository.save.mockRejectedValue(new Error('connection lost'));

      await expect(service.create(createDto, 'user-id')).rejects.toThrow('connection lost');
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the invoice does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAll status filtering', () => {
    it('filters Overdue as any non-Paid row past its due date', async () => {
      const { queryBuilder, calls } = createQueryBuilderMock();
      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findAll({ status: 'Overdue' } as Parameters<typeof service.findAll>[0]);

      expect(calls.some(({ args }) => String(args[0]).includes('invoice.status != :paid'))).toBe(
        true,
      );
      expect(
        calls.some(({ args }) => String(args[0]).includes('invoice.dueDate < CURRENT_DATE')),
      ).toBe(true);
    });

    it('filters Pending as persisted Pending rows that are not yet overdue', async () => {
      const { queryBuilder, calls } = createQueryBuilderMock();
      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findAll({ status: 'Pending' } as Parameters<typeof service.findAll>[0]);

      expect(
        calls.some(
          ({ args }) =>
            String(args[0]).includes('invoice.status = :status') &&
            (args[1] as { status?: string })?.status === 'Pending',
        ),
      ).toBe(true);
      expect(
        calls.some(({ args }) => String(args[0]).includes('invoice.dueDate >= CURRENT_DATE')),
      ).toBe(true);
    });

    it('never excludes a Paid row for being past its due date', async () => {
      const { queryBuilder, calls } = createQueryBuilderMock();
      repository.createQueryBuilder.mockReturnValue(queryBuilder);

      await service.findAll({ status: 'Paid' } as Parameters<typeof service.findAll>[0]);

      expect(calls.some(({ args }) => String(args[0]).includes('dueDate >='))).toBe(false);
    });
  });
});
