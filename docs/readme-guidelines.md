# README Guidelines

The README is the public package landing page. It should be useful for a new
consumer who does not know the implementation history.

## Timing

- PR 1 may keep a bootstrap README that points to docs.
- PR 2 should add local setup and command sections once scripts exist.
- PR 4 should add the first real scalar form example.
- PR 5 should add validation and server-error examples.
- PR 6 should add nested path and array examples.
- PR 7 should add `onPatch` and disposal examples.
- PR 8 should replace bootstrap wording with release-ready package docs.

## Target Structure

Use this structure for the release-ready README:

```text
# forms-core

Short one-liner.

Badges: npm version, CI, license, Sonar/quality gate when configured.

## Why
What problem the package solves and why it is headless.

## Install
npm install @revisium/forms-core @tanstack/form-core mobx

## Quick Start
Small createForm example with MobX reaction.

## Public API
createForm, field, arrayField, form wrapper, controls, arrays, patches.

## Validation
Sync, async, debounce, linked, form-level, submit.

## Server Errors
applyServerErrors lifecycle and clearing rules.

## Arrays
Stable item ids and operations.

## Autosave Patches
onPatch shape and examples.

## React Usage
Explain that React integration is consumer-side and not part of this package.

## Why Not @tanstack/react-form
Explain the MobX/headless adapter decision.

## Limitations
Link to docs/limitations.md.

## Development
Local commands and quality gate.

## Release
Link to docs/release-train.md.
```

## Writing Rules

- Keep examples short and executable.
- Prefer real behavior over marketing copy.
- Do not describe internals before showing public usage.
- Do not mention temporary implementation steps in the release-ready README.
- Keep package install commands accurate.
- Keep badges truthful: add CI/Sonar badges only after those checks exist.
- Keep React as an integration note, not a package feature.

## Example Standards

Every README example should either:

- be covered by a unit test;
- be small enough to compile as a TypeScript snippet after package scaffold; or
- be clearly marked as pseudocode during pre-release work.

Before release, remove pseudocode labels or replace the example.
