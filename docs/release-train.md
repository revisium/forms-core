# forms-core Release Train

This package is intended for npm publication as `@revisium/forms-core`.

Release automation must use the shared workflows from
`revisium/revisium-actions`, following the same pattern as `revisium-admin`.
Do not invent repo-local release scripts when a shared action already owns the
workflow.

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
- [ ] Temporary implementation trackers have been removed or replaced with
      durable docs.
- [ ] package exports are reviewed.
- [ ] no React/UI dependency is present.
- [ ] `@tanstack/form-core` and `mobx` dependency ranges are intentional.
- [ ] GitHub workflows delegate release and npm publish behavior to
      `revisium/revisium-actions`.

## Required GitHub Workflows

Add these workflows when the package scaffold and validation scripts exist:

- `.github/workflows/ci.yml` - local package checks for PRs and `master`.
- `.github/workflows/release-train.yml` - delegates release version transitions
  to `revisium/revisium-actions/.github/workflows/release-train.yml`, pinned to
  an approved commit or tag.
- `.github/workflows/npm-publish.yml` - delegates tag publishing to
  `revisium/revisium-actions/.github/workflows/npm-publish.yml`, pinned to an
  approved commit or tag.

Use the current `revisium-admin` workflows as the reference shape:

```yaml
jobs:
  release-train:
    uses: revisium/revisium-actions/.github/workflows/release-train.yml@<approved-ref>
    with:
      base_branch: master
      install_command: npm ci
      validate_command: npm run verify
```

```yaml
jobs:
  publish:
    uses: revisium/revisium-actions/.github/workflows/npm-publish.yml@<approved-ref>
    with:
      install_command: npm ci
      npm_access: public
      publish_auth: token
```

Do not use a floating branch such as `@master` for shared release workflows.
Pin to the approved `revisium-actions` ref used by the current Revisium release
train, then update intentionally in a separate maintenance PR when needed.

## Publish Flow

1. Create a release branch from fresh `origin/master`.
2. Run the full validation gate.
3. Bump version.
4. Commit the version change.
5. Push and open a PR when requested.
6. Wait for CI.
7. Merge after approval.
8. Publish through the approved `revisium-actions` npm workflow.
9. Verify the package on npm.

## Consumer Smoke Test

After publish, verify a clean project can:

```bash
npm install @revisium/forms-core mobx
```

Then run a minimal Node script that creates a form, observes a field with
`reaction`, sets a value, validates, resets, and disposes.
