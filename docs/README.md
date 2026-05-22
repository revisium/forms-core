# forms-core Docs

This directory is the package source of truth for architecture, quality gates,
release workflow, review policy, and reusable handoff guidance.

## Reading Order

1. [Architecture](./architecture.md)
2. [Reactivity Matrix](./reactivity-matrix.md)
3. [Quality Gates](./quality-gates.md)
4. [README Guidelines](./readme-guidelines.md)
5. [Known Limitations](./limitations.md)
6. [Release Train](./release-train.md)
7. [Review Checklist](./review/forms-core-checklist.md)
8. [Handoff](./handoff/README.md)

## Source-Of-Truth Rules

- Public API and behavior belong in `architecture.md`.
- MobX reaction coverage and no-extra-reaction expectations belong in
  `reactivity-matrix.md`.
- Validation, CI, Sonar, and package checks belong in `quality-gates.md`.
- Public package README shape belongs in `readme-guidelines.md`.
- Release and npm publish rules belong in `release-train.md`.

When implementation changes one of these contracts, update the matching doc in
the same PR.
