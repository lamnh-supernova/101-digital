import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { DisplayInvoiceStatus } from '../entities/invoice-status.enum';

export class CustomerResponseDto {
  @ApiProperty() fullname: string;
  @ApiProperty() email: string;
  @ApiPropertyOptional() mobileNumber?: string;
  @ApiPropertyOptional() address?: string;
}

export class InvoiceItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() quantity: number;
  @ApiProperty() rate: number;
}

export class InvoiceResponseDto {
  @ApiProperty() invoiceId: string;
  @ApiProperty() invoiceNumber: string;
  @ApiPropertyOptional() invoiceReference?: string;
  @ApiProperty() invoiceDate: string;
  @ApiProperty() dueDate: string;
  @ApiProperty() currency: string;
  @ApiProperty() currencySymbol: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty({ enum: ['Draft', 'Pending', 'Paid', 'Overdue'] })
  status: DisplayInvoiceStatus;
  @ApiProperty() invoiceSubTotal: number;
  @ApiProperty() totalTax: number;
  @ApiProperty() totalDiscount: number;
  @ApiProperty() totalAmount: number;
  @ApiProperty() totalPaid: number;
  @ApiProperty() balanceAmount: number;
  @ApiProperty({ type: CustomerResponseDto }) customer: CustomerResponseDto;
  @ApiProperty({ type: [InvoiceItemResponseDto] }) items: InvoiceItemResponseDto[];
  @ApiProperty() createdAt: string;
}

export class PagingDto {
  @ApiProperty() page: number;
  @ApiProperty() pageSize: number;
  @ApiProperty() total: number;
}

export class InvoiceListResponseDto {
  @ApiProperty({ type: [InvoiceResponseDto] }) data: InvoiceResponseDto[];
  @ApiProperty({ type: PagingDto }) paging: PagingDto;
}
