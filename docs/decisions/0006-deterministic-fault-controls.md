# ADR 0006: Deterministic fault controls

- Status: Accepted
- Date: 2026-09-26

## Decision

Expose process-local product fault controls only when test support is explicitly enabled. Protect configuration and inspection with the existing test-support token. Active targets make the corresponding normal API operation return `503 TEST_FAULT_ACTIVE` immediately.

Support the bounded targets `products.list`, `products.detail`, and `products.write`. Do not add delays, probability, frontend test switches, persistence, or Playwright-specific behavior. Clear all faults during `POST /api/test/reset`.

## Consequences

External suites can reproduce application error states through public HTTP behavior while preserving secure defaults. Fault configuration is shared within one API process, so parallel suites using the same instance must coordinate it. Network interception and transport-level failures remain responsibilities of the external automation framework.
