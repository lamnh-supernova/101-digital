import { loginRequestSchema } from './login.schema';

describe('loginRequestSchema', () => {
  it('trims the email and accepts valid credentials', () => {
    const result = loginRequestSchema.parse({
      email: '  reviewer@simpleinvoice.test  ',
      password: 'ReviewerPass123!',
    });

    expect(result).toEqual({ email: 'reviewer@simpleinvoice.test', password: 'ReviewerPass123!' });
  });

  it('rejects a malformed email address', () => {
    expect(loginRequestSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(
      false,
    );
  });

  it('requires a non-blank password', () => {
    expect(loginRequestSchema.safeParse({ email: 'a@example.test', password: '' }).success).toBe(
      false,
    );
  });

  it('rejects unknown extra fields', () => {
    const result = loginRequestSchema.safeParse({
      email: 'a@example.test',
      password: 'x',
      extra: 'y',
    });
    expect(result.success).toBe(false);
  });
});
