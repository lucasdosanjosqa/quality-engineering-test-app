# Architecture overview

CommerceOps begins as an npm workspace monorepo with three independently bounded projects:

```text
Browser -> apps/web -> HTTP /api -> apps/api -> SQLite
             |                       |
             +---- packages/contracts+
```

`apps/web` renders the browser interface and validates public API responses. `apps/api` owns HTTP behavior and validates data at its boundaries. `packages/contracts` contains only schemas and types that form the public agreement between them.

The API exclusively owns SQLite access, migrations, deterministic data operations, authentication, and authorization. The browser never imports database code. Product HTTP endpoints remain deferred to their own milestone.

## Development request flow

The browser requests `/api/health` from Vite. Vite proxies the request to the configured API host and port. The API explicitly parses the response with the shared Zod schema before returning it, and the web client parses the received JSON with the same schema.

The API uses Node's native `--env-file-if-exists` support. Vite reads the repository root as its `envDir`. Both have safe local defaults and reject invalid configured ports and hosts at startup.

## Build order

The root TypeScript project references contracts before API and web. Workspace scripts also build `@commerceops/contracts` before its consumers. Package exports resolve runtime and declaration files from `dist`; consumers do not use parallel path aliases.

## Persistence lifecycle

The server validates configuration, opens SQLite, applies pending migrations, and only then starts listening. Fastify closes the database as part of application shutdown. Tests use migrated in-memory databases and never share the development database.

The schema defines users, sessions, and products with foreign keys, uniqueness constraints, domain checks, and query-oriented indexes. Drizzle's TypeScript schema is the source of truth, while generated SQL migrations and snapshots are committed for reproducibility.

## Authentication flow

The login endpoint verifies a scrypt password hash and returns an opaque session token only through an HttpOnly cookie. SQLite stores the token's SHA-256 digest, not the token itself. Authenticated requests resolve the session and user server-side, enforce absolute expiration, and apply role checks at the API boundary. The web application restores the current user through `/api/auth/me` and uses protected routes for user experience, while the API remains the authorization authority.

## Product query flow

The authenticated catalog sends search, category, status, sorting, and pagination parameters to `GET /api/products`. The API validates them with the shared public contract and performs filtering, ordering, counting, and pagination in SQLite. Responses contain product summaries and explicit pagination metadata. The initial catalog is read-only; product mutations remain outside this milestone.

## Test data boundary

The same transactional reset service powers the local CLI and the optional HTTP endpoint. Test support is disabled by default. When enabled, startup requires a token of at least 16 characters and the endpoint compares its digest in constant time.
