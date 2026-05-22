# Repo-Local Agent Workflows

This directory contains agent-facing workflows and rules for `forms-core`.
They enforce the same contract as [../AGENTS.md](../AGENTS.md),
[../REVIEW.md](../REVIEW.md), and [../docs/](../docs/).

They are not a separate architecture source of truth. When public API,
architecture, validation behavior, review policy, or release behavior changes,
update the canonical docs first.

## Skills

- [`forms-core-general-checks`](./skills/forms-core-general-checks/SKILL.md)
  - baseline verification before handoff, PR creation, and review replies.
- [`forms-core-self-review`](./skills/forms-core-self-review/SKILL.md)
  - pre-handoff self-review against docs and architecture.
- [`forms-core-pr-review-iteration`](./skills/forms-core-pr-review-iteration/SKILL.md)
  - GitHub review-thread and failed-check workflow.
- [`forms-core-pr-publish`](./skills/forms-core-pr-publish/SKILL.md)
  - verified branch, commit, push, and PR creation workflow.

Every `SKILL.md` must include YAML frontmatter with `name` and `description`.

## Rules

Rules under [rules/](./rules/) are short reusable constraints for agents and
editors that understand `.mdc` rule files.
