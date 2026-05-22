# forms-core Release Train

This package is intended for npm publication as `@revisium/forms-core`.

## Release Principles

- Publish only after explicit user approval.
- Do not publish from an unverified branch.
- Do not publish from `master` directly.
- Do not create tags manually unless the release workflow requires it and the
  user approves.
- Verify package contents before publish.
- Keep README examples aligned with tested behavior.

## Versioning

Before `1.0.0`, use SemVer pre-1.0 rules:

- patch for fixes and internal hardening;
- minor for public API additions or behavior changes;
- prerelease versions for alpha/beta validation.

After `1.0.0`, use normal SemVer:

- major for breaking public API changes;
- minor for backward-compatible features;
- patch for bug fixes.

## Release Readiness Checklist

- [ ] `npm run verify` passes.
- [ ] `npm pack --dry-run` shows only expected files.
- [ ] README examples compile or are covered by tests.
- [ ] `docs/limitations.md` is current.
- [ ] `docs/steps.md` has been removed or replaced with durable history.
- [ ] package exports are reviewed.
- [ ] no React/UI dependency is present.
- [ ] `@tanstack/form-core` and `mobx` dependency ranges are intentional.

## Publish Flow

1. Create a release branch from fresh `origin/master`.
2. Run the full validation gate.
3. Bump version.
4. Commit the version change.
5. Push and open a PR when requested.
6. Wait for CI.
7. Merge after approval.
8. Publish through the approved npm release workflow.
9. Verify the package on npm.

## Consumer Smoke Test

After publish, verify a clean project can:

```bash
npm install @revisium/forms-core mobx
```

Then run a minimal Node script that creates a form, observes a field with
`reaction`, sets a value, validates, resets, and disposes.
