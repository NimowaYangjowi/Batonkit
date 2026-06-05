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

## User-Facing Risk

The current repository is on `main`, ahead of `origin/main` by local commits and behind by one remote commit. Shipping from this state could miss the remote README hero image commit or mix unrelated local work into the release.

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

- Regression risk: low. This phase only created the productization feature branch, merged the remote base branch, restored the existing working-tree changes, and recorded verification evidence.
- API clarity: unchanged. No public API behavior changed in this phase.
- Overengineering: avoided. The branch was created with the standard `codex/` prefix and the base merge used normal Git flow.
- Test gaps: acceptable for this phase. Baseline build, typecheck, unit tests, lint, and production dependency audit passed after the base merge.
- Docs gaps: improved. This document now records the actual branch and verification state that later phases should build on.
- Performance/cost impact: neutral. No runtime code, batching, query shape, caching, external API usage, or infrastructure behavior changed.
- Security impact: neutral. No secrets were added or changed; the existing unsafe example secret fallback is left for Phase 02.
- Public-package ergonomics: improved because productization now happens on a reviewable feature branch instead of directly on `main`.
- Later phase update: not required. The remaining phase order still matches the work needed.

## Completion Notes

- Base branch detected: `main`.
- Feature branch created: `codex/productization-readiness`.
- Existing working-tree changes were preserved with a temporary stash, `origin/main` was merged, and the stash was reapplied.
- Merge result: remote README hero image and `docs/assets/batonkit-hero.png` were incorporated through merge commit `b1a2ddf`.
- Starting status after merge: branch has no `HEAD..origin/main` commits remaining and carries the existing productization-related working-tree changes for later phases.
- Baseline commands:

```bash
npm run build        # passed
npm run typecheck    # passed
npm run test         # passed: 60 passed, 2 skipped
npm run lint         # passed
npm audit --omit=dev # passed: found 0 vulnerabilities
```

## Completion Checklist

- [x] Base branch detected
- [x] Feature branch created or selected
- [x] Base branch merged
- [x] Starting git state recorded
- [x] Baseline checks pass
- [x] Phase review completed
- [x] Phase document updated
- [x] Later phase documents updated if needed
- [x] Phase committed
