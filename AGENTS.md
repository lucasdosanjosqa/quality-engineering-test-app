# CommerceOps Engineering Guidelines

## Purpose

CommerceOps is a deterministic, realistic system under test for quality engineering portfolios and external automation frameworks. Product behavior must remain coherent; testability is part of the design, not a replacement for normal application behavior.

## Engineering principles

- Write source code, technical documentation, identifiers, comments, branch names, and commit messages in English.
- Keep TypeScript strict and validate data at runtime at system boundaries.
- Prefer small, concrete implementations over speculative abstractions.
- Use semantic HTML, correctly associated labels, and stable accessible names. Add `data-testid` only when no stable semantic locator exists.
- Keep behavior and test data deterministic. Do not add arbitrary delays or uncontrolled randomness.
- Keep dependencies proportional to demonstrated needs and document important architectural decisions.
- Run formatting, linting, type checking, tests, and builds before considering a milestone complete.
- Follow Conventional Commits, but do not commit, push, or advance milestones without explicit user approval.

## Application boundaries

- `apps/web` owns browser presentation and interaction. It communicates with the API only through public HTTP contracts.
- `apps/api` owns HTTP behavior, validation, authentication, authorization, business rules, and persistence.
- `packages/contracts` contains only public request and response schemas and their derived types. It must not contain business logic or server internals.
- Database access, when introduced, belongs exclusively to the API.
- Test seed and reset capabilities, when introduced, must be explicitly enabled, deterministic, and unavailable by default.

## SUT limits

- Do not add Playwright, Page Objects, Playwright fixtures, or logic coupled to an external automation repository.
- Do not add artificial product behavior solely to create automation scenarios.
- Do not implement future milestones before they are approved.
- Preserve unrelated user changes and the existing `LICENSE` file.
- External test projects must interact only through public URLs and HTTP contracts such as `APP_BASE_URL` and `API_BASE_URL`.
