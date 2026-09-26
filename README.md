# CommerceOps

CommerceOps is a deterministic commerce operations application designed as a realistic system under test for quality engineering portfolios and external automation frameworks.

## Current scope

The application foundation currently provides:

- a Fastify `GET /api/health` endpoint;
- a public Zod response contract shared through `@commerceops/contracts`;
- cookie-based login, logout, and current-user endpoints;
- persisted server-side sessions with absolute expiration;
- Admin and Viewer authorization with an Admin-only summary endpoint;
- protected React routes for login, dashboard, and administration;
- an accessible authenticated shell with role-aware navigation, skip links, and page titles;
- a protected product catalog with server-side search, filters, sorting, and pagination;
- product details and Admin-only creation, editing, and deletion workflows;
- responsive layouts, keyboard-operable confirmation dialogs, and an authenticated not-found page;
- a Vite proxy from `/api` to the backend;
- API integration and isolated component tests;
- a migrated SQLite database with users, sessions, and products;
- deterministic seed and reset operations;
- an opt-in, token-protected `POST /api/test/reset` endpoint;
- opt-in deterministic fault controls for product list, detail, and write operations;
- a consistent public API error contract.

File upload, password recovery, and Playwright tests are not implemented yet.

## Requirements

- Node.js 24.19.0
- npm 11.x

## Local setup

```bash
npm install
copy .env.example .env
npm run dev
```

On macOS or Linux, replace the `copy` command with `cp`.

The `.env` file is optional. Node loads it natively for the API with `--env-file-if-exists`, while Vite reads the same root file through `envDir`. Defaults match `.env.example`:

- web: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:3000`
- health endpoint through the web proxy: `http://127.0.0.1:5173/api/health`
- login page: `http://127.0.0.1:5173/login`

Invalid hosts, ports, session durations, or cookie security values fail before the corresponding development server starts. Sessions last 60 minutes by default. Set `SESSION_COOKIE_SECURE=true` whenever the API is served over HTTPS; the local HTTP default is `false`.

The default database is stored at `apps/api/data/commerceops.sqlite` and is created automatically when the API starts. Its migrations are versioned under `apps/api/drizzle`.

## Deterministic data

Apply migrations and restore the baseline data with:

```bash
npm run db:migrate
npm run db:reset
```

The reset always creates 2 users, 12 products, and no sessions. Use these fictional credentials locally:

| Role   | Email                    | Password     |
| ------ | ------------------------ | ------------ |
| Admin  | `admin@commerceops.dev`  | `Admin123!`  |
| Viewer | `viewer@commerceops.dev` | `Viewer123!` |

To expose the reset operation over HTTP, add both values below to the root `.env` file:

```dotenv
TEST_SUPPORT_ENABLED=true
TEST_SUPPORT_TOKEN=local-test-support-token
```

Then call it with the configured token:

```bash
curl -X POST http://127.0.0.1:3000/api/test/reset \
  -H "x-test-support-token: local-test-support-token"
```

The route does not exist while test support is disabled. Never enable it in a publicly reachable environment.

### Deterministic faults

When test support is enabled, a protected control can make normal product routes return `503 TEST_FAULT_ACTIVE` without adding delays or randomness:

```bash
curl -X PUT http://127.0.0.1:3000/api/test/faults \
  -H "content-type: application/json" \
  -H "x-test-support-token: local-test-support-token" \
  -d '{"target":"products.list","enabled":true}'
```

Valid targets are `products.list`, `products.detail`, and `products.write`. Inspect the current state with `GET /api/test/faults`, disable a target with the same `PUT` payload and `enabled: false`, or clear every fault with `POST /api/test/reset`. Fault state is process-local and is not persisted.

These controls support deterministic product-state testing. External network interception remains the responsibility of the external automation framework.

## Authentication endpoints

- `POST /api/auth/login` creates a server-side session and sets an HttpOnly cookie.
- `POST /api/auth/logout` revokes the current session and clears the cookie.
- `GET /api/auth/me` returns the authenticated user.
- `GET /api/admin/summary` requires the Admin role.
- `GET /api/products` lists products for authenticated users and accepts `search`, `category`, `status`, `sortBy`, `sortOrder`, `page`, and `pageSize` query parameters.
- `GET /api/products/:id` returns product details to authenticated users.
- `POST /api/products`, `PUT /api/products/:id`, and `DELETE /api/products/:id` require the Admin role.

The browser never stores credentials or session tokens in web storage. Invalid login attempts return the same public error whether the email is unknown or the password is incorrect.

## Commands

```bash
npm run dev
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm run db:migrate
npm run db:reset
```

The contracts workspace is built before its consumers. TypeScript project references enforce the same dependency order during type checking.

## Repository boundaries

- `apps/web` owns browser presentation and calls only public API endpoints.
- `apps/api` owns HTTP behavior and server-side validation.
- `packages/contracts` exposes public runtime schemas and derived TypeScript types.
- External automation repositories consume CommerceOps only through its public URLs and contracts.

See [the architecture overview](docs/architecture/overview.md) and [AGENTS.md](AGENTS.md) for the durable engineering constraints.
