---
name: gitlab-workflow
description: Runs ctf-dashboard development through GitLab issues and merge requests—assign @me when starting work, small commits with issue references, push, and MRs that close or reference issues. Use when starting or finishing tracked work, when creating follow-up tasks, or when the user mentions issues, MRs, backlog, or GitLab workflow.
---

# GitLab workflow (ctf-dashboard)

## When this applies

Use this skill for implementation work in this repository when work should align with GitLab tracking—not for one-off local experiments unless the user opts out.

## Source of work

- **GitLab issues** are the backlog. Prefer working from an open issue over treating chat as the only spec. Use the project issue list (labels, milestones, **blocked by** / related issue links) to see dependencies and priority.
- **[AGENTS.md](../../../AGENTS.md)** lists build and test commands; this skill expands how to execute tracked work on GitLab.

## Creating issues

- If you find a bug, missing test, or follow-up that is not already tracked, **create an issue** with `glab issue create` and a clear title and scope.
- **Bug reports:** apply the **`bug`** label so they can be filtered. Example: `glab issue create -t "…" -d "…" -l bug`, or add the label afterward with `glab issue update <iid> -l bug`.
- Prefer **one focused issue** per coherent change; split large work with GitLab **related issues** / blocking links when useful.
- For `glab` syntax, flags, and CI helpers (`glab ci lint`, `glab mr list`, etc.), use [.agents/skills/glab/SKILL.md](../glab/SKILL.md).

## Starting work on an issue

- When you **start** work on an issue, **assign it to the current user** immediately, for example: `glab issue update <iid> -a @me` (or `-a yourusername` from `glab auth status` if `@me` is not accepted).
- To **add** an assignee without replacing existing ones, prefix with `+` per `glab issue update --help` (e.g. `-a +@me`).
- Skip this only if the user explicitly works without `glab` auth or the issue is read-only for some reason.

## Branches and commits

- Use a branch named for the work, e.g. `feat/short-topic` or `fix/issue-12-description`.
- **Commit often** in small logical steps.
- For message **shape** (Conventional Commits subject), follow [.agents/skills/commit/SKILL.md](../commit/SKILL.md).
- **Always tie commits to the issue** when there is one:
  - Preferred: include the number in the subject, e.g. `feat(db): add events migration (#12)`.
  - In the **merge request description**, use GitLab keywords so issues link or close when the MR merges: `Closes #12`, `Fixes #12`, or `Resolves #12` to close; `Related to #12` to link without closing. GitLab also scans merge commit messages for the same keywords.

If the commit skill’s “no footers” guidance conflicts with linking, **prefer issue linkage**: use `(#N)` in the subject, or the appropriate closing/linking line in the MR description.

## Push

- **Push** the branch to GitLab when a slice of work is complete or when stopping for a handoff—do not leave completed work only on a local machine unless the user asked.

## Merge request

- Open a **merge request** when the branch is ready for review or merge: `glab mr create` (interactive), or non-interactive example: `glab mr create -t "…" -d "Closes #12" -y`.
- In the MR description, **link the issue** with `Closes #12`, `Fixes #12`, `Resolves #12`, or `Related to #12` so GitLab can close or link the work when the MR merges.
- You can also create an MR from an issue: `glab mr create --related-issue <iid>` (see `glab mr create --help`).
- Summarize what changed and how to verify (tests run, manual checks). Use `glab ci status` or `glab pipeline ci view` to confirm pipeline results.

## Quick checklist

- [ ] Issue exists (or created) for this work
- [ ] Bug issues have the **`bug`** label
- [ ] Issue assigned to current user when work started
- [ ] Commits are small and reference `#N` or the MR description links the issue
- [ ] Branch pushed
- [ ] MR opened with `Closes` / `Fixes` / `Resolves` / `Related to` the issue where appropriate
