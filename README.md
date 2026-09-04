# SimpleInvoice

A full-stack invoice management application: authenticate, list/search/filter/sort/paginate
invoices, view an invoice's full detail, and create a new invoice with server-computed totals.

Built for the 101 Digital Full Stack Web Engineer assessment.

## Overview

SimpleInvoice is a **monorepo** with two independent applications and a database:

```text
SimpleInvoice/
├── frontend/          # Next.js (React) app — TypeScript, client-rendered
├── backend/           # NestJS API — TypeScript, PostgreSQL via TypeORM
├── docker-compose.yml # Brings up postgres + backend + frontend together
└── README.md
```

No external third-party APIs are used. The backend owns all data, business logic, and
authentication; the frontend is a browser client of that API.

### Architecture

```text
Browser (React) --JWT bearer--> NestJS API --TypeORM--> PostgreSQL
```

- **Authentication** is JWT-based. `POST /auth/login` verifies an email/password against a
  bcrypt hash and returns a signed access token. The browser stores that token (see
  `frontend/src/lib/auth-storage.ts`) and sends it as `Authorization: Bearer <token>` on every
  subsequent request — this app does not use cookies or a server-side session store.
- **The frontend** (`frontend/`) is a Next.js App Router project used purely as a React +
  TypeScript framework/bundler/router: every data-bearing page is a Client Component that calls
  the API directly (`frontend/src/lib/api-client.ts`) and holds no server-side logic of its own —
  there is no BFF layer, no Server Actions, no Route Handlers. This is a deliberate consequence
  of the client-held-JWT model: only the browser knows the token, so only the browser can call
  the API.
- **The backend** (`backend/`) is a NestJS REST API: `AuthModule` (login, current-user profile),
  `InvoicesModule` (list/detail/create), `UsersModule`. A global `ValidationPipe`
  (class-validator/class-transformer) and a global exception filter normalise every error
  response to `{ statusCode, message, error }`. Swagger/OpenAPI docs are generated automatically
  and served at `/api/docs`.
- **The database** is PostgreSQL, accessed through TypeORM entities (`Invoice`, `InvoiceItem`,
  `User`). The schema is created directly from those entities on boot (`synchronize: true`) —
  there is no migration tooling for this assessment build, so `docker compose up` and
  `npm run start:dev` both work from an empty database with no extra steps. Customer details are
  stored as **embedded columns on the `invoices` table** (`customerFullname`, `customerEmail`,
  `customerMobileNumber`, `customerAddress`) rather than a separate `customers` table, since each
  invoice always has exactly one customer and there is no requirement to query customers
  independently of their invoices.

### Business logic

- `subTotal = quantity × rate`
- `taxAmount = subTotal × (taxPercent / 100)` — `taxPercent` defaults to `10`
- `totalAmount = subTotal + taxAmount − discount` — `discount` is a flat amount, defaulting to `0`
- `balanceAmount = totalAmount − totalPaid` — `totalPaid` is always `0` for a newly created invoice
- New invoices are always created with status **Draft**; only `Draft`, `Pending`, and `Paid` are
  ever persisted.
- **Overdue is derived, never stored.** On every read, `if status != "Paid" AND dueDate < today`
  the invoice is presented as `Overdue`; the underlying persisted status is untouched. Filtering
  by status matches this exactly: filtering `Draft`/`Pending` excludes rows that have become
  overdue, and filtering `Overdue` matches any non-`Paid` row past its due date regardless of its
  persisted status.
- `invoiceNumber` is enforced unique at the database level; a duplicate returns `409 Conflict`.
- `dueDate` must be on or after `invoiceDate`, validated server-side (and mirrored client-side for
  immediate feedback) with the message `dueDate must be on or after invoiceDate`.
- All totals are computed **server-side only** — the API never trusts a client-submitted total.

## Getting started without Docker

Requires Node.js 22+ and a running PostgreSQL instance.

### 1. Database

Create a database (matching the values in `backend/.env`, or your own):

```sh
createdb simple_invoice
```

### 2. Backend

```sh
cd backend
npm ci
cp .env.example .env   # edit DATABASE_URL / JWT_SECRET if needed
npm run seed            # creates the reviewer account + ~32 sample invoices
npm run start:dev
```

The API listens on `http://localhost:4000`; Swagger UI is at `http://localhost:4000/api/docs`.

### 3. Frontend

```sh
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Getting started with Docker

Requires Docker with Compose.

```sh
docker compose up --build
```

This single command starts PostgreSQL, runs the seed script, starts the API, and starts the
frontend — all from an empty database. Once healthy:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)
- Swagger UI: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

Override any default via a `.env` file at the repository root (see `.env.example`) or exported
environment variables — `JWT_SECRET`, `SEED_USER_EMAIL`, `SEED_USER_PASSWORD`, etc.

To stop: `docker compose down`. To also delete the database volume: `docker compose down -v`.

## Reviewer login

The seed script (`npm run seed`, run automatically by `docker compose up`) creates one reviewer
account. Defaults (override via `SEED_USER_EMAIL` / `SEED_USER_PASSWORD` / `SEED_USER_FULLNAME`):

| Field    | Value                          |
| -------- | ------------------------------- |
| Email    | `reviewer@simpleinvoice.test`   |
| Password | `ReviewerPass123!`              |

The seed script is **idempotent** — re-running `npm run seed` against a database that already has
invoices only logs a message and does nothing further; it will not duplicate data or fail.

## API

Full interactive documentation (requests, query parameters, response schemas, status codes) is at
`/api/docs` once the backend is running. Summary:

| Method | Endpoint         | Auth | Description                                          |
| ------ | ---------------- | :--: | ----------------------------------------------------- |
| POST   | `/auth/login`    |  ✗   | Authenticate with email + password, return a JWT      |
| GET    | `/auth/me`       |  ✓   | Return the current authenticated user's profile       |
| GET    | `/invoices`      |  ✓   | List invoices — search, filter, sort, paginate        |
| GET    | `/invoices/:id`  |  ✓   | Get one invoice's full detail by id                    |
| POST   | `/invoices`      |  ✓   | Create a new invoice (always status `Draft`)           |

`GET /invoices` query parameters: `page`, `pageSize`, `sortBy` (`invoiceDate` \| `dueDate` \|
`totalAmount`), `ordering` (`ASC` \| `DESC`), `status` (`Draft` \| `Pending` \| `Paid` \|
`Overdue`), `keyword` (partial, case-insensitive match on invoice number or customer name),
`fromDate`, `toDate`.

## Testing

**Backend** (`backend/`, run from that directory):

```sh
npm test            # unit tests: totals, Overdue derivation, due-date validation, DTO validation
npm run test:e2e     # integration test against a real database: login, create, list, conflict
npm run test:coverage
```

The unit suite explicitly covers the PDF's four required areas: invoice total calculations,
Overdue status derivation, due-date validation, and unique invoice-number enforcement
(`src/invoices/invoice-money.spec.ts`, `invoice-status.spec.ts`,
`dto/create-invoice.dto.spec.ts`, `invoices.service.spec.ts`). `test/app.e2e-spec.ts` is the
required integration test covering the complete workflow of creating an invoice and confirming
it appears in the list.

**Frontend** (`frontend/`, run from that directory):

```sh
npm test             # Jest + React Testing Library: schemas, domain logic, components
npm run test:e2e      # Playwright: full browser flows against a real backend + database
npm run check          # format:check, lint, typecheck, test:coverage, build, test:e2e
```

`npm run test:e2e` starts its own backend and frontend instances (ports 4100/3100) via
`playwright.config.ts` and requires a reachable PostgreSQL database — by default the standard
`docker-compose` instance on `localhost:5432`; override with `PLAYWRIGHT_DATABASE_URL` to point
at a different one. Seeding is idempotent, so re-runs are safe.

## Assumptions and design decisions

- **Client-held JWT.** The assessment brief explicitly asks for the JWT to be "securely stored on
  the client side for use in subsequent API requests," so the browser calls the API directly with
  `Authorization: Bearer <token>` rather than the app proxying requests through a server-side
  session. The trade-off is the standard one for this pattern: an XSS vulnerability anywhere on
  the page could read the token from storage. No such vulnerability is known; this is a
  documented, deliberate choice to match the specified architecture, not an oversight.
- **`discount` is a flat amount, not a percentage.** The requirements table lists `Tax (%)` with an
  explicit percent sign and a plain `Discount` without one, and the formula
  `totalAmount = subTotal + taxAmount - discount` uses `discount` directly (not
  `subTotal × discount%`) — so discount is treated as a currency amount in the invoice's own
  currency.
- **`currencySymbol` is derived server-side** from the submitted ISO 4217 `currency` code via
  `Intl.NumberFormat`, rather than being client-supplied, so it can't disagree with the currency
  code.
- **Customer is embedded on the invoice row**, not a separate table — see Architecture above.
- **Schema managed via TypeORM `synchronize: true`**, not migrations — appropriate for this
  assessment's scope; a production system would use versioned migrations instead.
- **No password reset / account management UI.** Only the seeded reviewer account exists; the
  brief explicitly excludes advanced password policies and only requires one seeded account.
- **The Playwright suite runs sequentially against one shared database** (not per-test isolated
  fixtures), since there's no lightweight way to sandbox PostgreSQL per test in this setup;
  assertions are written to tolerate a growing dataset (e.g. scoping to a uniquely-generated
  invoice number) rather than depending on exact totals.

## Known limitations

- No pagination/virtualisation tuning beyond the documented `pageSize` values (10/20/50); very
  large datasets are untested.
- No rate limiting or brute-force protection on `POST /auth/login`.
- No automated accessibility audit beyond the semantics exercised by the Playwright suite
  (landmarks, focus management, keyboard operability, no horizontal overflow at representative
  widths) — manual screen-reader/contrast/zoom review was not performed.
- No CI workflow is included in this repository.
