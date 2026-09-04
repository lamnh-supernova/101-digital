import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

import { IsDueDateOnOrAfterInvoiceDate } from './due-date-on-or-after.validator';

export class CustomerDto {
  @ApiProperty({ example: 'Paul Tan' })
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @ApiProperty({ example: 'paul@example.test' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  @ApiPropertyOptional({ example: '+6591234567' })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional({ example: 'Singapore' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class InvoiceItemInputDto {
  @ApiProperty({ example: 'Consulting services' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  quantity: number;

  @ApiProperty({ example: 125.5 })
  @IsNumber()
  @IsPositive()
  rate: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ type: CustomerDto })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @ApiProperty({ example: 'INV-1001' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiPropertyOptional({ example: '#PO-4471' })
  @IsOptional()
  @IsString()
  invoiceReference?: string;

  @ApiProperty({ example: '2026-06-03' })
  @IsDateString()
  invoiceDate: string;

  @ApiProperty({ example: '2026-07-03' })
  @IsDateString()
  @IsDueDateOnOrAfterInvoiceDate()
  dueDate: string;

  @ApiProperty({ example: 'GBP' })
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/, { message: 'currency must be a three-letter ISO 4217 code' })
  currency: string;

  @ApiPropertyOptional({ example: 'Invoice issued for consulting work' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: InvoiceItemInputDto })
  @ValidateNested()
  @Type(() => InvoiceItemInputDto)
  item: InvoiceItemInputDto;

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Tax percentage, 0-100' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxPercent?: number = 10;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Flat discount amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number = 0;
}
