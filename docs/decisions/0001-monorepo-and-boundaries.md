# ADR 0001: Monorepo and application boundaries

- Status: Accepted
- Date: 2026-09-26

## Decision

Use npm workspaces for `apps/web`, `apps/api`, and `packages/contracts`. The browser and API remain separate applications and integrate only through HTTP. The contracts package exposes public schemas and types without business logic or server internals.

## Rationale

The structure supports coordinated contract changes without introducing a monorepo orchestrator. It also preserves the same URL-based boundary that external automation frameworks will use.

## Consequences

Contracts must build before runtime consumers. TypeScript project references and root build scripts enforce that order. Database code, when introduced, remains private to the API.
