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
- temporary step trackers for the initial implementation sequence;
- repo-local skills and rules;
- local quality gates, including ESLint, coverage, CI Sonar, and local Sonar;
- a zero-tolerance Sonar issue-inspection rule, because a passing Quality Gate
  can still leave unresolved issues;
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
docs/steps.md                  # temporary, remove before release readiness
docs/pr-plan.md                # temporary, remove before release readiness
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
5. Replace implementation steps.
6. Keep the final cleanup rule for temporary step trackers.
7. Keep symlink layout compatible with Claude Code:
   `CLAUDE.md -> AGENTS.md` and `.claude/skills -> ../.agents/skills`.
8. Add local Sonar scripts early. They must read `SONAR_TOKEN` only from the
   environment or an untracked `.env.sonar`, and should prefer PR analysis over
   branch analysis when the SonarCloud organization blocks non-main branch
   gates.
9. Require Sonar issue inspection in addition to Quality Gate status for PRs.
   The unresolved valid PR issue count must be `0`. Keep master/release branch
   push builds as scan-only so existing branch-level issue totals do not block
   the branch after merge.
