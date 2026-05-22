# Quality Gates

This document defines local verification, CI expectations, Sonar handling, and
package checks for `forms-core`.

## Docs And Agent Gate

For documentation-only changes or before installing dependencies:

```bash
git status --short --branch
git diff --check
rg -n "[ \t]+$" README.md AGENTS.md REVIEW.md docs .agents
node scripts/lint-skills.mjs
```

The skill lint script is repo-local so this repository can be validated without
the demo workspace. Once dependencies are installed, `npm run verify` is the
primary gate.

## Local Scripts

The package scaffold provides these scripts:

```json
{
  "scripts": {
    "build": "tsdown && npm run build:dts",
    "build:dts": "tsc --emitDeclarationOnly --outDir dist --declaration --declarationMap",
    "dev": "tsdown --watch",
    "test": "NODE_OPTIONS=--experimental-vm-modules jest --passWithNoTests",
    "test:watch": "NODE_OPTIONS=--experimental-vm-modules jest --watch",
    "test:cov": "NODE_OPTIONS=--experimental-vm-modules jest --coverage --silent --passWithNoTests",
    "sonar:local": "bash scripts/sonar-local.sh",
    "sonar:issues:local": "bash scripts/sonar-issues-local.sh",
    "ci:local:sonar": "bash scripts/ci-local-sonar.sh",
    "lint:ci": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"**/*.{ts,js,mjs,md,json,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,js,mjs,md,json,yml,yaml}\"",
    "markdown:lint": "markdownlint-cli2",
    "skills:lint": "node scripts/lint-skills.mjs",
    "tsc": "tsc --noEmit",
    "verify": "npm run markdown:lint && npm run skills:lint && npm run format:check && npm run tsc && npm run lint:ci && npm run test:cov && npm run build"
  }
}
```

`npm run verify` is the single local PR gate.

## Required PR Checks

Once CI exists, a PR is not ready while any required check is failed or pending.

Expected required checks:

- install dependencies;
- `npm run verify`;
- unit coverage report;
- package build;
- Sonar quality gate when `SONAR_TOKEN` is configured.

Release and npm publish checks should be implemented through reusable workflows
from `revisium/revisium-actions`, not bespoke repo-local release logic.

## Sonar

CI runs Sonar through `.github/workflows/ci.yml` when `SONAR_TOKEN` is
configured. Push builds on `master` and release branches upload Sonar analysis
without blocking on the branch-level total issue count. Pull requests enforce
both the Quality Gate and unresolved issue inspection.

Local Sonar uses the same project config and waits for the PR quality gate:

```bash
cp .env.sonar.example .env.sonar
# Fill SONAR_TOKEN locally, or export SONAR_TOKEN from your shell.
npm run ci:local:sonar
```

`npm run ci:local:sonar` removes stale coverage, runs `npm run verify`, and then
runs `npm run sonar:local` and `npm run sonar:issues:local`.
`npm run sonar:local` requires `coverage/lcov.info` and fails fast if coverage
is missing. Keep `.env.sonar` untracked.

Run local Sonar after the branch has a GitHub PR whenever possible. The script
uses `gh pr view` to send PR analysis parameters:

- `sonar.pullrequest.key`
- `sonar.pullrequest.branch`
- `sonar.pullrequest.base`

If there is no PR, the script falls back to branch analysis. SonarCloud may
reject non-main branch quality-gate lookup depending on the organization plan.
For manual PR analysis, set:

```bash
SONAR_PR_KEY=123 SONAR_PR_BRANCH=my-branch SONAR_PR_BASE=master npm run sonar:local
```

For PRs, Quality Gate `PASSED` is necessary but not sufficient. Every PR must
inspect the unresolved Sonar issue list:

```bash
npm run sonar:issues:local
```

The accepted PR unresolved issue count is `0`. Fix every valid issue, including
minor maintainability issues. If an issue is a false positive, document the
rule, file, line, message, and evidence, then use the narrowest accepted
suppression only when this repository permits it. Do not report PR Sonar as done
unless both the Quality Gate and unresolved issue inspection pass.

Do not apply PR zero-issue enforcement to `master` or release branch push
builds. Branch builds should publish analysis so the project history is visible,
but they must not fail only because existing branch-level issue totals are
non-zero.

When Sonar is configured, resolve the project key in this order:

1. `.sonarlint/connectedMode.json`;
2. `sonar-project.properties`;
3. package or build config containing `sonar.projectKey`;
4. CI workflow config;
5. explicit project name from the user.

Do not guess the project key.

For a Sonar failure or non-zero issue count:

1. Inspect the linked quality gate and issue list.
2. Record rule, file, line, and message.
3. Fix the underlying issue when valid.
4. If false positive, document evidence and use the narrowest allowed
   suppression only if the repo allows suppressions.
5. Re-run local checks and re-check PR status.

Do not weaken code, tests, or docs only to silence Sonar.

## Coverage

Coverage should focus on behavior that defines the public contract:

- MobX reaction to field values and form validity;
- reset and meta state;
- sync/async/debounced validation;
- linked validation;
- server errors;
- nested paths;
- arrays with stable ids;
- patches;
- disposal.

Avoid coverage padding with method-existence tests.

## Package Checks

Before release readiness:

```bash
npm pack --dry-run
```

Inspect that the package contains only expected files:

- `dist`;
- `README.md`;
- `LICENSE`;
- package metadata.

Do not publish until package contents are verified and the user approves.
