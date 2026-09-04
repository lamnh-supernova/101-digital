import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(4000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN_SECONDS: Joi.number().integer().min(60).max(86400).default(3600),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  SEED_USER_EMAIL: Joi.string()
    .email({ tlds: { allow: false } })
    .default('reviewer@simpleinvoice.test'),
  SEED_USER_PASSWORD: Joi.string().min(8).default('ReviewerPass123!'),
  SEED_USER_FULLNAME: Joi.string().default('Assessment Reviewer'),
});
