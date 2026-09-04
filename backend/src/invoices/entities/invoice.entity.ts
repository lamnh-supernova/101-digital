import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { DecimalTransformer } from '../../common/transformers/decimal.transformer';
import { InvoiceStatus } from './invoice-status.enum';
import { InvoiceItem } from './invoice-item.entity';

const money = () =>
  ({
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: new DecimalTransformer(),
  }) as const;

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  invoiceId: string;

  @Index({ unique: true })
  @Column()
  invoiceNumber: string;

  @Column({ nullable: true })
  invoiceReference?: string;

  @Column({ type: 'date' })
  invoiceDate: string;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ length: 3 })
  currency: string;

  @Column()
  currencySymbol: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column(money())
  invoiceSubTotal: number;

  @Column(money())
  totalTax: number;

  @Column(money())
  totalDiscount: number;

  @Column(money())
  totalAmount: number;

  @Column({ ...money(), default: 0 })
  totalPaid: number;

  @Column(money())
  balanceAmount: number;

  @Column()
  customerFullname: string;

  @Column()
  customerEmail: string;

  @Column({ nullable: true })
  customerMobileNumber?: string;

  @Column({ nullable: true })
  customerAddress?: string;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true, eager: true })
  items: InvoiceItem[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  createdBy?: string;
}
