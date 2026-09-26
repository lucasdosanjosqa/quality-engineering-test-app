# ADR 0005: Server-side cookie sessions

- Status: Accepted
- Date: 2026-09-26

## Decision

Use opaque, cryptographically random session tokens in HttpOnly cookies. Store only each token's SHA-256 digest in SQLite, associate it with a user, and enforce a configurable absolute expiration that defaults to 60 minutes.

Cookies use `SameSite=Lax` and `Path=/`. The `Secure` attribute is disabled only by the safe local HTTP default and must be enabled for HTTPS deployments. The API owns authentication and role authorization; protected frontend routes are navigation behavior, not a security boundary.

Passwords use scrypt hashes and timing-safe verification. Invalid credentials share one public response so the endpoint does not reveal whether an email exists.

## Consequences

Sessions can be revoked immediately on logout and never need to be stored in browser web storage. Every authenticated request requires a database lookup. Absolute expiration is intentionally simple; refresh tokens, sliding expiration, password recovery, and broader CSRF controls remain outside this milestone.
