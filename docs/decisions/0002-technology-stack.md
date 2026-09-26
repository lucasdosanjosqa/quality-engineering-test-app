# ADR 0002: M1 technology stack

- Status: Accepted
- Date: 2026-09-26

## Decision

Use Node.js 24, npm workspaces, strict TypeScript, React with Vite, Fastify, Zod, Vitest, Testing Library, ESLint, and Prettier.

Use Node's native environment-file support for the API and Vite's `envDir` for the frontend tooling. Do not add `dotenv`.

## Rationale

The stack creates a small but production-shaped frontend/API boundary. Zod provides explicit runtime validation without adding a Fastify adapter before richer API schemas justify one.

## Consequences

M1 carries no database, router, server-state library, form library, CSS Modules, mocking server, or external E2E framework. Dependencies will be introduced only with an approved concrete use.
