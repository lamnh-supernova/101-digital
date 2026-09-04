import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { envValidationSchema } from './config/env.validation';
import { InvoiceItem } from './invoices/entities/invoice-item.entity';
import { Invoice } from './invoices/entities/invoice.entity';
import { InvoicesModule } from './invoices/invoices.module';
import { User } from './users/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url: configService.get<string>('DATABASE_URL'),
        entities: [Invoice, InvoiceItem, User],
        // No migration tooling for this assessment build: the schema is
        // created directly from entities on boot so `docker compose up`
        // works from zero with a single command.
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    InvoicesModule,
  ],
})
export class AppModule {}
