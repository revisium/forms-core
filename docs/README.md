# forms-core Docs

This directory is the package source of truth for architecture, quality gates,
release workflow, review policy, and package-specific guidance.

## Reading Order

1. [Architecture](./architecture.md)
2. [Reactivity Matrix](./reactivity-matrix.md)
3. [Quality Gates](./quality-gates.md)
4. [Known Limitations](./limitations.md)
5. [Release Train](./release-train.md)
6. [Review Checklist](./review/forms-core-checklist.md)

## Source-Of-Truth Rules

- Public API and behavior belong in `architecture.md`.
- MobX reaction coverage and no-extra-reaction expectations belong in
  `reactivity-matrix.md`.
- Validation, CI, Sonar, and package checks belong in `quality-gates.md`.
- Public package usage and examples belong in the root `README.md`.
- Release and npm publish rules belong in `release-train.md`.

When implementation changes one of these contracts, update the matching doc in
the same PR.
