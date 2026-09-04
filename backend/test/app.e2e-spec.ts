import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import type { Repository } from 'typeorm';

import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { User } from '../src/users/user.entity';

describe('SimpleInvoice API (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  const testEmail = `e2e-${Date.now()}@example.test`;
  const testPassword = 'E2ePassword123!';
  const testInvoiceNumber = `E2E-${Date.now()}`;
  // Computed relative to "now" so the created invoice's derived status stays
  // Draft (not Overdue) no matter when this suite runs.
  const invoiceDate = new Date().toISOString().slice(0, 10);
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const earlierDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    userRepository = moduleRef.get(getRepositoryToken(User));
    await userRepository.save(
      userRepository.create({
        email: testEmail,
        passwordHash: await bcrypt.hash(testPassword, 4),
        fullname: 'E2E Reviewer',
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects an unauthenticated request to a protected endpoint', async () => {
    await request(app.getHttpServer()).get('/invoices').expect(401);
  });

  it('rejects a login with the wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: 'wrong-password' })
      .expect(401);
  });

  it('logs in, creates an invoice, and finds it in the list and by id', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;
    expect(accessToken).toEqual(expect.any(String));

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(meResponse.body.email).toBe(testEmail);

    const createResponse = await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer: { fullname: 'Alex Morgan', email: 'alex@example.test' },
        invoiceNumber: testInvoiceNumber,
        invoiceDate,
        dueDate,
        currency: 'GBP',
        item: { name: 'Consulting', quantity: 2, rate: 100 },
        taxPercent: 10,
        discount: 0,
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      invoiceNumber: testInvoiceNumber,
      status: 'Draft',
      invoiceSubTotal: 200,
      totalTax: 20,
      totalAmount: 220,
      balanceAmount: 220,
    });

    const listResponse = await request(app.getHttpServer())
      .get('/invoices')
      .query({ keyword: testInvoiceNumber })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].invoiceNumber).toBe(testInvoiceNumber);
    expect(listResponse.body.paging).toMatchObject({ page: 1, pageSize: 10, total: 1 });

    const detailResponse = await request(app.getHttpServer())
      .get(`/invoices/${createResponse.body.invoiceId as string}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(detailResponse.body.invoiceNumber).toBe(testInvoiceNumber);
  });

  it('rejects a duplicate invoice number with 409 Conflict', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    const accessToken = loginResponse.body.accessToken as string;

    await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer: { fullname: 'Alex Morgan', email: 'alex@example.test' },
        invoiceNumber: testInvoiceNumber,
        invoiceDate,
        dueDate,
        currency: 'GBP',
        item: { name: 'Consulting', quantity: 1, rate: 50 },
      })
      .expect(409);
  });

  it('rejects a due date before the invoice date with a structured 400 response', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);
    const accessToken = loginResponse.body.accessToken as string;

    const response = await request(app.getHttpServer())
      .post('/invoices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer: { fullname: 'Alex Morgan', email: 'alex@example.test' },
        invoiceNumber: `${testInvoiceNumber}-bad-date`,
        invoiceDate,
        dueDate: earlierDate,
        currency: 'GBP',
        item: { name: 'Consulting', quantity: 1, rate: 50 },
      })
      .expect(400);

    expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    expect(response.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining('dueDate must be on or after invoiceDate')]),
    );
  });
});
