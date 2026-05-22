# forms-core Docs

This directory is the implementation source of truth while the package is being
built.

## Reading Order

1. [Architecture](./architecture.md)
2. [Implementation Steps](./steps.md)
3. [PR Plan](./pr-plan.md)
4. [Quality Gates](./quality-gates.md)
5. [README Guidelines](./readme-guidelines.md)
6. [Known Limitations](./limitations.md)
7. [Release Train](./release-train.md)
8. [Review Checklist](./review/forms-core-checklist.md)
9. [Handoff](./handoff/README.md)

## Source-Of-Truth Rules

- Public API and behavior belong in `architecture.md`.
- In-progress sequencing belongs in `steps.md`.
- PR boundaries belong in `pr-plan.md`.
- Validation, CI, Sonar, and package checks belong in `quality-gates.md`.
- Public package README shape belongs in `readme-guidelines.md`.
- Release and npm publish rules belong in `release-train.md`.

When implementation changes one of these contracts, update the matching doc in
the same PR.
