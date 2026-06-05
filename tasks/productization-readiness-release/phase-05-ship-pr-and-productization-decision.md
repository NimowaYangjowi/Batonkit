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

## User-Facing Risk

Running `/ship` too early could create a PR with stale tests, unreviewed release notes, or missing live verification. Running it from `main` would violate the ship workflow and make review harder.

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

## Completion Notes

- Branch: `codex/productization-readiness`.
- Base: `origin/main`; confirmed `origin/main` is an ancestor of `HEAD`.
- PR: https://github.com/NimowaYangjowi/Batonkit/pull/1
- Productization decision: **Public beta ready**, not production-stable.
- No npm publish was performed.
- Final release gates:

```bash
npm run build                    # passed
npm run typecheck                # passed
npm run test                     # passed: 60 passed, 2 skipped
npm run test:postgres            # passed: 1 integration file, 2 tests
npm run test:pack                # passed
npm run drill:failover           # passed
npm run drill:railway-live       # passed: local -> backup -> local
npm run drill:railway-live:remote # passed: local -> backup -> local
npm run lint                     # passed
npm audit --omit=dev             # passed: 0 vulnerabilities
```

- Remote drill retry note: the first final `railway run --service backup-worker` attempt failed because it injected Railway's internal `postgres-jw1q.railway.internal` database URL while the command itself was running on the local Mac. The retry used the Railway public Postgres proxy URL for the local drill client while keeping the deployed `backup-worker` URL for the remote worker proof.

## Phase Review

- Status: complete. The branch was pushed, PR #1 was created, all release gates passed, and the productization decision was recorded.
- Regression risk: moderate because the PR includes runtime, Postgres, failover, Next.js route security, examples, release metadata, and live-drill harness changes. Risk is mitigated by unit tests, Docker-backed Postgres integration, pack smoke, simulated failover, local Railway drill, and remote Railway drill.
- API clarity: improved. Public docs now describe generic BatonKit primitives, public beta status, explicit control route auth, failback reconciliation, and Railway provider standby behavior.
- Overengineering: acceptable. The live-drill harness adds test seams for repeatable verification, but they are isolated to the example harness rather than leaking into public package APIs.
- Test gaps: no blocking gaps for public beta. Stable release still needs real adopter feedback and operational runbooks for failed migrations, stuck leases, degraded workers, and provider outages.
- Docs gaps: no blocking beta docs gap. README, CHANGELOG, release docs, Railway live drill docs, and phase docs are synchronized.
- Performance/cost impact: acceptable. No new always-on background cost was added beyond the retained Railway lab resources; `Postgres-jw1q` remains intentionally available for repeatable release checks, while the old offline `Postgres` service should be cleaned up or explicitly retained.
- Security impact: positive. Example control route now requires an explicit secret, control-plane reads are private by default, and public backup readiness no longer exposes ownership details without bearer auth.
- Public-package ergonomics: beta-ready. Package versions are `0.1.0-beta.0`, pack smoke passes, docs explain required wiring, and the final PR is reviewable.

## Completion Checklist

- [x] Not on base/default branch
- [x] Earlier phases committed
- [x] Final release gates pass
- [x] `/ship` workflow completed or blocker recorded
- [x] PR URL recorded
- [x] Documentation sync completed
- [x] Final productization decision recorded
- [x] Phase review completed
- [x] Phase document updated
- [x] Phase committed
