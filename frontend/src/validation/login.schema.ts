import { z } from 'zod';

export const loginRequestSchema = z
  .object({
    email: z
      .string({ error: 'Enter your email address.' })
      .trim()
      .min(1, 'Enter your email address.')
      .max(254, 'Email must be 254 characters or fewer.')
      .email('Enter a valid email address.'),
    password: z
      .string({ error: 'Enter your password.' })
      .min(1, 'Enter your password.')
      .max(1_024, 'Password must be 1,024 characters or fewer.'),
  })
  .strict();

export type LoginRequest = z.output<typeof loginRequestSchema>;
