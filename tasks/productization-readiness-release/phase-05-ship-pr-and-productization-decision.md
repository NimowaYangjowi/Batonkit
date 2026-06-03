# Phase 05: Ship PR And Productization Decision

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

Run the `/ship` workflow from the productization feature branch, create the release-candidate PR, and record the final productization decision.

Plain language: after the fixes and checks are done, use the shipping truck to create a reviewable PR, then write down whether BatonKit is ready for beta or still blocked.

## User-Facing Risk

Running `/ship` too early could create a PR with stale tests, unreviewed release notes, or missing live verification. Running it from `main` would violate the ship workflow and make review harder.

Plain language: do not send the package to reviewers until the box has the right label and every important lock has been checked.

## Files

- Modify: this phase document
- Modify docs generated or synchronized by `/ship` and `/document-release`
- Do not publish npm packages in this phase without explicit user approval

## Tasks

1. Confirm the branch is not the base/default branch:

```bash
git branch --show-current
```

2. Confirm all earlier phases are committed:

```bash
git status --short --branch
git log --oneline --decorate origin/<base>..HEAD
```

Replace `<base>` with the detected base branch from the `/ship` workflow.

3. Run a final local release gate before `/ship`:

```bash
npm run build
npm run typecheck
npm run test
npm run test:postgres
npm run test:pack
npm run drill:failover
npm run drill:railway-live
npm run drill:railway-live:remote
npm run lint
npm audit --omit=dev
```

4. Run `/ship` according to the skill workflow:

- detect base branch
- merge base before tests
- run tests on the merged branch
- run coverage audit and pre-landing review
- auto-generate version/changelog changes if the workflow applies
- commit bisectable chunks
- push the feature branch
- create the PR
- run `/document-release` follow-up

5. If `/ship` stops for missing Eng Review, ASK-level findings, test failures, merge conflicts, or minor/major version decisions, resolve those blockers before continuing.
6. Record the PR URL and ship workflow outcome in this phase document.
7. Make the final decision:

- **Public beta ready** if every required gate passes, docs are honest, control route secret safety is fixed, and `/ship` creates a clean PR.
- **Private preview only** if local gates pass but live Railway/Postgres proof is missing.
- **Not ready** if security defaults, package installability, Postgres integration, or failover behavior fails.

8. Review this phase and update `Phase Review`.
9. Commit any final decision-doc updates:

```bash
git add tasks/productization-readiness-release/phase-05-ship-pr-and-productization-decision.md
git commit -m "docs: record productization ship decision"
```

10. Push final documentation commit if `/ship` already created and pushed the branch.

## Acceptance Criteria

- `/ship` runs from a feature branch, not `main`.
- All release gates have fresh evidence.
- The PR exists and includes the productization changes.
- Documentation is synchronized after the PR is created.
- The final decision is written as public beta ready, private preview only, or not ready.
- No npm publish occurs without explicit approval.
- The phase is reviewed, documented, and committed separately.

## Phase Review

- Pending.

## Completion Checklist

- [ ] Not on base/default branch
- [ ] Earlier phases committed
- [ ] Final release gates pass
- [ ] `/ship` workflow completed or blocker recorded
- [ ] PR URL recorded
- [ ] Documentation sync completed
- [ ] Final productization decision recorded
- [ ] Phase review completed
- [ ] Phase document updated
- [ ] Phase committed
