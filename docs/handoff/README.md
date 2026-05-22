# forms-core Handoff

This is the starting point for an agent or developer taking over the repository.

## Read In Order

1. [AGENTS.md](../../AGENTS.md)
2. [REVIEW.md](../../REVIEW.md)
3. [docs/architecture.md](../architecture.md)
4. [docs/reactivity-matrix.md](../reactivity-matrix.md)
5. [docs/quality-gates.md](../quality-gates.md)
6. [docs/readme-guidelines.md](../readme-guidelines.md)
7. [docs/review/forms-core-checklist.md](../review/forms-core-checklist.md)
8. [docs/limitations.md](../limitations.md)
9. [docs/release-train.md](../release-train.md)

## Normal Iteration

1. Check branch and worktree.
2. Confirm the intended scope from the current user request and the durable docs
   above.
3. Update durable docs when behavior, public API, release workflow, or review
   policy changes.
4. Add or update tests for real behavior.
5. Run required validation.
6. Run self-review against [REVIEW.md](../../REVIEW.md).
7. Commit, push, or open a PR only when the user asks.

## Repo-Local Skills

Use skills in this order:

1. [`forms-core-general-checks`](../../.agents/skills/forms-core-general-checks/SKILL.md)
   before handoff or PR updates.
2. [`forms-core-self-review`](../../.agents/skills/forms-core-self-review/SKILL.md)
   before calling the work ready.
3. [`forms-core-pr-review-iteration`](../../.agents/skills/forms-core-pr-review-iteration/SKILL.md)
   when GitHub review threads drive the work.
4. [`forms-core-pr-publish`](../../.agents/skills/forms-core-pr-publish/SKILL.md)
   only when the user asks to publish work.
