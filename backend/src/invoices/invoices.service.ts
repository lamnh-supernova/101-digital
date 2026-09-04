import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';

import type { CreateInvoiceDto } from './dto/create-invoice.dto';
import type { InvoiceListResponseDto, InvoiceResponseDto } from './dto/invoice-response.dto';
import type { InvoiceQueryDto } from './dto/invoice-query.dto';
import { Invoice } from './entities/invoice.entity';
import { InvoiceStatus } from './entities/invoice-status.enum';
import { calculateInvoiceTotals, currencySymbolFor } from './invoice-money';
import { toInvoiceResponse } from './invoices.mapper';

const POSTGRES_UNIQUE_VIOLATION = '23505';

@Injectable()
export class InvoicesService {
  constructor(@InjectRepository(Invoice) private readonly invoices: Repository<Invoice>) {}

  async findAll(query: InvoiceQueryDto): Promise<InvoiceListResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const sortBy = query.sortBy ?? 'invoiceDate';
    const ordering = query.ordering ?? 'DESC';

    const qb = this.invoices
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.items', 'items');

    if (query.keyword !== undefined && query.keyword.trim() !== '') {
      qb.andWhere(
        '(invoice.invoiceNumber ILIKE :keyword OR invoice.customerFullname ILIKE :keyword)',
        { keyword: `%${query.keyword.trim()}%` },
      );
    }

    if (query.fromDate !== undefined) {
      qb.andWhere('invoice.invoiceDate >= :fromDate', { fromDate: query.fromDate });
    }

    if (query.toDate !== undefined) {
      qb.andWhere('invoice.invoiceDate <= :toDate', { toDate: query.toDate });
    }

    this.applyStatusFilter(qb, query.status);

    qb.orderBy(`invoice.${sortBy}`, ordering)
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();

    return {
      data: rows.map(toInvoiceResponse),
      paging: { page, pageSize, total },
    };
  }

  /**
   * Filters must match what deriveDisplayStatus() would show: Draft/Pending
   * exclude rows that have become Overdue, and Overdue matches any
   * non-Paid row past its due date regardless of persisted status.
   */
  private applyStatusFilter(qb: SelectQueryBuilder<Invoice>, status?: string): void {
    if (status === undefined) {
      return;
    }

    if (status === 'Overdue') {
      qb.andWhere('invoice.status != :paid', { paid: InvoiceStatus.PAID }).andWhere(
        'invoice.dueDate < CURRENT_DATE',
      );
      return;
    }

    qb.andWhere('invoice.status = :status', { status });

    if (status !== InvoiceStatus.PAID) {
      qb.andWhere('invoice.dueDate >= CURRENT_DATE');
    }
  }

  async findOne(invoiceId: string): Promise<InvoiceResponseDto> {
    const invoice = await this.invoices.findOne({ where: { invoiceId } });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return toInvoiceResponse(invoice);
  }

  async create(dto: CreateInvoiceDto, createdBy: string): Promise<InvoiceResponseDto> {
    const taxPercent = dto.taxPercent ?? 10;
    const discount = dto.discount ?? 0;
    const totals = calculateInvoiceTotals({
      quantity: dto.item.quantity,
      rate: dto.item.rate,
      taxPercent,
      discount,
    });
    const currency = dto.currency.toUpperCase();

    const invoice = this.invoices.create({
      invoiceNumber: dto.invoiceNumber.trim(),
      invoiceReference: dto.invoiceReference?.trim(),
      invoiceDate: dto.invoiceDate,
      dueDate: dto.dueDate,
      currency,
      currencySymbol: currencySymbolFor(currency),
      description: dto.description?.trim(),
      status: InvoiceStatus.DRAFT,
      invoiceSubTotal: totals.subTotal,
      totalTax: totals.taxAmount,
      totalDiscount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      totalPaid: 0,
      balanceAmount: totals.balanceAmount,
      customerFullname: dto.customer.fullname.trim(),
      customerEmail: dto.customer.email.trim(),
      customerMobileNumber: dto.customer.mobileNumber?.trim(),
      customerAddress: dto.customer.address?.trim(),
      createdBy,
      items: [{ name: dto.item.name.trim(), quantity: dto.item.quantity, rate: dto.item.rate }],
    });

    try {
      const saved = await this.invoices.save(invoice);
      return toInvoiceResponse(saved);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Invoice number already exists');
      }

      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === POSTGRES_UNIQUE_VIOLATION
    );
  }
}
