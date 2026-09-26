# ADR 0004: Deterministic test data

- Status: Accepted
- Date: 2026-09-26

## Decision

Maintain one versioned baseline with fixed entity IDs, SKUs, timestamps, users, roles, and fictional credentials. A single transactional service resets the database for both the local CLI and the protected HTTP endpoint.

The HTTP route is absent unless `TEST_SUPPORT_ENABLED=true`. Enabling it also requires `TEST_SUPPORT_TOKEN` with at least 16 characters.

## Consequences

External test suites can start from a known state without coupling to internal fixtures. Concurrent suites still share one database and must serialize resets until a per-worker isolation strategy is introduced.
