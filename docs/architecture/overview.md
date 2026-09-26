# Architecture overview

CommerceOps begins as an npm workspace monorepo with three independently bounded projects:

```text
Browser -> apps/web -> HTTP /api -> apps/api
             |                       |
             +---- packages/contracts+
```

`apps/web` renders the browser interface and validates public API responses. `apps/api` owns HTTP behavior and validates data at its boundaries. `packages/contracts` contains only schemas and types that form the public agreement between them.

M1 intentionally has no database, authentication, product domain, or test-support module. Those capabilities require separate milestone approval.

## Development request flow

The browser requests `/api/health` from Vite. Vite proxies the request to the configured API host and port. The API explicitly parses the response with the shared Zod schema before returning it, and the web client parses the received JSON with the same schema.

The API uses Node's native `--env-file-if-exists` support. Vite reads the repository root as its `envDir`. Both have safe local defaults and reject invalid configured ports and hosts at startup.

## Build order

The root TypeScript project references contracts before API and web. Workspace scripts also build `@commerceops/contracts` before its consumers. Package exports resolve runtime and declaration files from `dist`; consumers do not use parallel path aliases.
