# ADR 0003: SQLite persistence with Drizzle

- Status: Accepted
- Date: 2026-09-26

## Decision

Use SQLite through Node's built-in `node:sqlite` driver and Drizzle ORM. Keep the TypeScript schema as the source of truth and commit generated SQL migrations and snapshots.

Pin `drizzle-orm` and `drizzle-kit` to `1.0.0-rc.4`. The stable Drizzle line does not expose the `node:sqlite` adapter, while its migration CLI currently includes a development dependency with a known moderate vulnerability.

## Consequences

The selected packages and Node SQLite API are release candidates and require integration coverage before upgrades. In return, the project avoids an external native binding, installs with zero known vulnerabilities, and retains a direct migration path to later stable versions.

Database files remain local and ignored. The API applies committed migrations before listening and owns all database access.
