---
name: forms-core-pr-publish
description: >-
  Publish verified forms-core work by creating or reusing a conventional branch
  from fresh master, checking for an existing GitHub PR, committing, pushing,
  and creating a PR with an intentionally empty description when requested.
metadata:
  short-description: Publish forms-core work
---

# forms-core PR Publish Skill

Use this skill only when the user asks to create a branch, commit local changes,
push, or open/update a GitHub PR.

## Required Inputs

- Target base branch. Default: `master`.
- Branch intent and conventional prefix.
- Commit title.

Allowed branch prefixes:

```text
feat/
fix/
docs/
chore/
refactor/
test/
ci/
build/
perf/
```

Do not use `codex/` in branch names.

## Preflight

1. Inspect branch, remote, and local changes:

   ```bash
   git status --short --branch
   git remote -v
   gh auth status
   ```

2. Refuse to publish from `master` directly.
3. Fetch fresh base before creating a publish branch:

   ```bash
   git fetch origin master
   git switch -c <prefix>/<slug> origin/master
   ```

4. If already on a non-master branch, check whether a PR exists:

   ```bash
   gh pr view --json url,state,baseRefName,headRefName
   ```

## Verification Gate

Before staging, committing, pushing, or creating a PR:

```bash
npm run verify
```

When Sonar is configured and a PR exists, run or inspect both:

```bash
npm run ci:local:sonar
npm run sonar:issues:local
```

Do not treat a passing Sonar Quality Gate as sufficient. The unresolved valid
PR Sonar issue count must be `0`. This is a PR gate; branch pushes should remain
scan-only for Sonar.

For the docs-only bootstrap before package scripts exist:

```bash
git diff --check
```

If validation fails, stop.

## Publish

1. Stage only intended files.
2. Run `git diff --cached --check`.
3. Commit with a conventional message.
4. Push with upstream if needed.
5. Create a PR with `--body ""` when no PR exists and the user asked for a PR.

## Output Format

```text
Publish:
- Branch:
- PR:
- Existing PR:
- Verification:
- Commit:
- Push:
- Remaining risks:
```
