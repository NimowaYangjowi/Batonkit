# Phase 01: Branch And Baseline State

> **Phase Operating Rules**
>
> - Keep this phase independently shippable and commit it when complete.
> - At phase end, run a review focused on regression risk, API clarity, overengineering, test gaps, docs gaps, performance/cost impact, security impact, and public-package ergonomics.
> - Record review findings in this phase document under `Phase Review`.
> - Update the completion checklist in this phase document before moving on.
> - If implementation changes the architecture, update all later phase documents before starting the next phase.
> - If implementation changes what was completed, update the completed plan notes in this phase before committing.
> - Commit this phase separately from later phases so regressions can be traced to one coherent product slice.
> - Do not carry product-specific names, database tables, job types, deployment secrets, or UI concepts into the public API.
> - Do not add fallback code just to make a check pass. Fix the earliest correct source of missing or invalid state.
> - When using `/ship`, do not run the full workflow from `main`; switch to a `codex/` feature branch first.

## Goal

Create a clean release-candidate working branch and record the exact starting state before productization changes begin.

Plain language: before fixing the package, make sure we are working on the right branch and know what changed locally versus what changed on GitHub.

## User-Facing Risk

The current repository is on `main`, ahead of `origin/main` by local commits and behind by one remote commit. Shipping from this state could miss the remote README hero image commit or mix unrelated local work into the release.

Plain language: if two people wrote on the same checklist, first combine the pages before sending the checklist to customers.

## Files

- Update this phase document
- Update later phase documents only if branch reconciliation changes the remaining work

## Tasks

1. Detect the base branch using the `/ship` skill logic:

```bash
gh pr view --json baseRefName -q .baseRefName
gh repo view --json defaultBranchRef -q .defaultBranchRef.name
```

Fall back to `main` if both commands fail.

2. Create a feature branch using the Codex branch prefix:

```bash
git switch -c codex/productization-readiness
```

If the branch already exists, switch to it and inspect its status.

3. Fetch and merge the base branch before implementation:

```bash
git fetch origin <base>
git merge origin/<base> --no-edit
```

Replace `<base>` with the detected base branch, for example `main`.

If conflicts appear, resolve only the conflicts required for this release plan. Do not revert unrelated user changes.

4. Record the starting evidence:

```bash
git status --short --branch
git log --oneline --decorate HEAD..origin/<base>
git log --oneline --decorate origin/<base>..HEAD
git diff --stat
```

5. Re-run the already-passing local baseline to prove the reconciled branch starts healthy:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

6. Update this document with the actual branch name, base branch, merge result, and command results.

7. Review this phase and update `Phase Review`.

8. Commit:

```bash
git add tasks/productization-readiness-release/phase-01-branch-and-baseline-state.md
git commit -m "docs: record productization baseline state"
```

## Acceptance Criteria

- Work is on a `codex/` feature branch, not `main`.
- The base branch has been fetched and merged, or unresolved conflicts are clearly documented.
- Baseline commands pass on the reconciled branch.
- This phase document records the real starting state and review findings.
- The phase is committed separately.

## Phase Review

- Pending.

## Completion Checklist

- [ ] Base branch detected
- [ ] Feature branch created or selected
- [ ] Base branch merged
- [ ] Starting git state recorded
- [ ] Baseline checks pass
- [ ] Phase review completed
- [ ] Phase document updated
- [ ] Later phase documents updated if needed
- [ ] Phase committed
