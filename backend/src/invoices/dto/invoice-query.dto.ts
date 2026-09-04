import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const SORTABLE_FIELDS = ['invoiceDate', 'dueDate', 'totalAmount'] as const;
export type SortableField = (typeof SORTABLE_FIELDS)[number];

export const FILTER_STATUSES = ['Draft', 'Pending', 'Paid', 'Overdue'] as const;
export type FilterStatus = (typeof FILTER_STATUSES)[number];

export class InvoiceQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiPropertyOptional({ enum: SORTABLE_FIELDS, default: 'invoiceDate' })
  @IsOptional()
  @IsIn(SORTABLE_FIELDS)
  sortBy?: SortableField = 'invoiceDate';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  ordering?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ enum: FILTER_STATUSES })
  @IsOptional()
  @IsIn(FILTER_STATUSES)
  status?: FilterStatus;

  @ApiPropertyOptional({ description: 'Partial, case-insensitive invoice number or customer name' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
