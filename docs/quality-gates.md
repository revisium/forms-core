# Quality Gates

This document defines local verification, CI expectations, Sonar handling, and
package checks for `forms-core`.

## Current Docs-Only Gate

Before the package scaffold exists:

```bash
git status --short --branch
git diff --check
rg -n "[ \t]+$" README.md AGENTS.md REVIEW.md docs .agents
node ../demo/demo-rpg-frontend/scripts/lint-skills.mjs
```

The skill lint command reuses the demo script until `forms-core` has its own
package scripts.

## Planned Local Scripts

PR 2 should add scripts equivalent to:

```json
{
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "test": "NODE_OPTIONS=--experimental-vm-modules jest",
    "test:watch": "NODE_OPTIONS=--experimental-vm-modules jest --watch",
    "test:cov": "NODE_OPTIONS=--experimental-vm-modules jest --coverage --silent",
    "lint:ci": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"**/*.{ts,md,json,yml,yaml}\"",
    "format:check": "prettier --check \"**/*.{ts,md,json,yml,yaml}\"",
    "markdown:lint": "markdownlint-cli2",
    "skills:lint": "node scripts/lint-skills.mjs",
    "tsc": "tsc --noEmit",
    "verify": "npm run markdown:lint && npm run skills:lint && npm run tsc && npm run lint:ci && npm test && npm run build"
  }
}
```

The final script names can follow the chosen toolchain, but `npm run verify`
must be the single local PR gate.

## Required PR Checks

Once CI exists, a PR is not ready while any required check is failed or pending.

Expected required checks:

- install dependencies;
- `npm run verify`;
- unit coverage report;
- package build;
- Sonar or quality gate when configured.

## Sonar

When Sonar is configured, resolve the project key in this order:

1. `.sonarlint/connectedMode.json`;
2. `sonar-project.properties`;
3. package or build config containing `sonar.projectKey`;
4. CI workflow config;
5. explicit project name from the user.

Do not guess the project key.

For a Sonar failure:

1. Inspect the linked quality gate or issue list.
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
