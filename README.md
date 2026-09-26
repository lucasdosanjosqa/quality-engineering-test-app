# CommerceOps

CommerceOps is a deterministic commerce operations application designed as a realistic system under test for quality engineering portfolios and external automation frameworks.

## M1 scope

The current foundation provides one vertical slice:

- a Fastify `GET /api/health` endpoint;
- a public Zod response contract shared through `@commerceops/contracts`;
- a React interface with loading, success, error, and retry states;
- a Vite proxy from `/api` to the backend;
- API integration and isolated component tests.

Database access, authentication, product management, test-support endpoints, and Playwright tests are intentionally outside this milestone.

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

Invalid hosts or ports fail before the corresponding development server starts.

## Commands

```bash
npm run dev
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

The contracts workspace is built before its consumers. TypeScript project references enforce the same dependency order during type checking.

## Repository boundaries

- `apps/web` owns browser presentation and calls only public API endpoints.
- `apps/api` owns HTTP behavior and server-side validation.
- `packages/contracts` exposes public runtime schemas and derived TypeScript types.
- External automation repositories consume CommerceOps only through its public URLs and contracts.

See [the architecture overview](docs/architecture/overview.md) and [AGENTS.md](AGENTS.md) for the durable engineering constraints.
