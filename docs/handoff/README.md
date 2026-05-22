# forms-core Handoff

This is the starting point for an agent or developer taking over the repository.

## Read In Order

1. [AGENTS.md](../../AGENTS.md)
2. [REVIEW.md](../../REVIEW.md)
3. [docs/architecture.md](../architecture.md)
4. [docs/steps.md](../steps.md)
5. [docs/pr-plan.md](../pr-plan.md)
6. [docs/quality-gates.md](../quality-gates.md)
7. [docs/readme-guidelines.md](../readme-guidelines.md)
8. [docs/review/forms-core-checklist.md](../review/forms-core-checklist.md)
9. [docs/limitations.md](../limitations.md)
10. [docs/release-train.md](../release-train.md)

## Normal Iteration

1. Check branch and worktree.
2. Read the current unchecked item in [docs/steps.md](../steps.md).
3. Confirm the PR scope from [docs/pr-plan.md](../pr-plan.md).
4. Implement only that scope.
5. Add or update tests for real behavior.
6. Run required validation.
7. Update [docs/steps.md](../steps.md).
8. Run self-review against [REVIEW.md](../../REVIEW.md).
9. Commit, push, or open a PR only when the user asks.

## Repo-Local Skills

Use skills in this order:

1. [`forms-core-implementation-step`](../../.agents/skills/forms-core-implementation-step/SKILL.md)
   for normal implementation work.
2. [`forms-core-general-checks`](../../.agents/skills/forms-core-general-checks/SKILL.md)
   before handoff or PR updates.
3. [`forms-core-self-review`](../../.agents/skills/forms-core-self-review/SKILL.md)
   before calling the work ready.
4. [`forms-core-pr-review-iteration`](../../.agents/skills/forms-core-pr-review-iteration/SKILL.md)
   when GitHub review threads drive the work.
5. [`forms-core-pr-publish`](../../.agents/skills/forms-core-pr-publish/SKILL.md)
   only when the user asks to publish work.

## Temporary Artifacts

[docs/steps.md](../steps.md) is intentionally temporary. It coordinates the
multi-PR build. The final release-readiness PR should remove it or replace it
with durable history after the implementation is reflected in stable docs,
tests, and README examples.
