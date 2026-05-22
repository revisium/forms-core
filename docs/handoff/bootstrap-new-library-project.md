# Bootstrap A New Library Project For Agents

This document captures the approach used in the first `forms-core` commit. It is
intended to be copied by future agents when starting another library project.

## Idea

The first commit should not rush into implementation. It should lay down the
rails that make the desired result reachable through small, reviewable steps.

For a library, that means the initial PR creates:

- the agent boot file;
- the review contract;
- the architecture contract;
- the step tracker;
- the PR sequence;
- repo-local skills and rules;
- release notes for npm/package publication;
- a handoff entry point.

The first commit should answer: "How can an agent that sees only this repository
continue safely without the original chat?"

## Why This Works

- It keeps architectural decisions out of chat-only context.
- It makes each future PR small enough to review.
- It gives review bots a stable rule source.
- It gives agents a deterministic reading order.
- It prevents implementation from drifting away from the target API.
- It gives the final PR a clear cleanup task for temporary coordination docs.

## Files To Create

```text
AGENTS.md
CLAUDE.md -> AGENTS.md
REVIEW.md
README.md
.agents/README.md
.agents/skills/<project>-implementation-step/SKILL.md
.agents/skills/<project>-general-checks/SKILL.md
.agents/skills/<project>-self-review/SKILL.md
.agents/skills/<project>-pr-review-iteration/SKILL.md
.agents/skills/<project>-pr-publish/SKILL.md
.agents/rules/*.mdc
.claude/skills -> ../.agents/skills
docs/architecture.md
docs/steps.md
docs/pr-plan.md
docs/release-train.md
docs/review/<project>-checklist.md
docs/handoff/README.md
docs/handoff/bootstrap-new-library-project.md
```

## First PR Rules

- Do not add package implementation.
- Do not add dependencies.
- Do not publish.
- Do not hide unresolved decisions in chat.
- Do create enough docs for a future agent to continue.
- Do make `docs/steps.md` explicitly temporary.

## Copy Checklist

When copying this pattern:

1. Replace project names and package names.
2. Replace architecture constraints with project-specific constraints.
3. Replace allowed dependency policy.
4. Replace review checklist items.
5. Replace PR plan steps.
6. Keep the final cleanup rule for temporary step trackers.
7. Keep symlink layout compatible with Claude Code:
   `CLAUDE.md -> AGENTS.md` and `.claude/skills -> ../.agents/skills`.
