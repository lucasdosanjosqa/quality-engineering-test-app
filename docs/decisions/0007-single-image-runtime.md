# ADR 0007: Single-image production runtime

## Status

Accepted.

## Decision

Package CommerceOps as one container image. Fastify serves the compiled React assets and API from the same origin, while SQLite data is stored on a mounted volume. Static serving is enabled only when `WEB_DIST_DIR` is configured, so the existing Vite development workflow remains unchanged. A new, empty database receives the deterministic baseline after migration; subsequent starts preserve its state.

The image uses a multi-stage build, installs only API and contracts production dependencies in the runtime stage, runs as the Node image's non-root user, and exposes one health-checked HTTP port.

## Consequences

External test frameworks receive one stable base URL, cookie behavior stays same-origin, and the SUT can be started reproducibly with Docker Compose. Packaging couples frontend and API releases into one artifact, but their source and HTTP contract boundaries remain separate. A reverse proxy and multiple containers can be introduced later if independent scaling or deployment becomes a demonstrated need.
