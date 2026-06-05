# BatonKit Productization Readiness Plan

> **For implementers:** Read this folder before writing code. Each phase document begins with the same operating rules. Follow those rules literally: complete one phase, commit it, review it, update the completed phase notes, then update future phase plans if implementation changed the design.

## Goal

Move BatonKit from a developer-preview package toward a public beta release candidate, while preserving an honest decision boundary between "safe to preview" and "production-stable."

## Review Inputs

This plan is based on the productization review from 2026-06-03:

- Baseline checks passed locally: build, typecheck, unit tests, lint, production dependency audit, pack consumer smoke, and simulated failover drill.
- `npm run test:postgres` could not complete because Docker was not running.
- `npm run drill:railway-live` and `npm run drill:railway-live:remote` could not complete because required BatonKit live-drill environment variables were missing.
- The repository is on `main`, ahead of `origin/main` by 20 commits and behind by 1 commit.
- The Next.js example control route still falls back to `dev-secret`.
- Package versions are still `0.0.0`, and release docs still describe the project as pre-release.
- The `/ship` skill was requested, but its workflow must not ship directly from the base/default branch.

## Target User

Small Next.js/Vercel + Postgres teams that want:

- a local worker to process background jobs most of the time
- a cloud backup worker to take over when local hardware is down
- clear install and setup instructions
- security defaults that do not rely on hidden or guessed values
- release notes that tell them what is preview-only and what is ready to trust

## Phase Index

1. `phase-01-branch-and-baseline-state.md` - complete
2. `phase-02-control-route-secret-safety.md` - complete
3. `phase-03-required-verification-gates.md` - complete
4. `phase-04-release-metadata-and-beta-docs.md` - complete
5. `phase-05-ship-pr-and-productization-decision.md` - complete

## Final Decision

Decision on 2026-06-04: **public beta ready**, not production-stable.

PR: https://github.com/NimowaYangjowi/Batonkit/pull/1

## Cross-Phase Verification

Run the baseline checks before considering any phase complete:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

Add targeted checks when the phase touches those surfaces:

- Postgres behavior: `npm run test:postgres`
- Package export or installability behavior: `npm run test:pack`
- Failover behavior: `npm run drill:failover`
- Railway live drill harness behavior: `npm run drill:railway-live`
- Railway remote live drill behavior: `npm run drill:railway-live:remote`

## Ship Skill Rules For This Plan

- Use the `/ship` skill only from a feature branch, not from `main`.
- If the current branch is the base/default branch, create or switch to a `codex/` feature branch before running the full ship workflow.
- Treat `/ship` as the final PR workflow after the implementation phases are committed.
- Do not let `/ship` publish to npm. The PR should prepare a beta release candidate and final decision notes.
- If `/ship` finds missing Eng Review, failing tests, merge conflicts, or ASK-level review findings, stop and resolve them before release.

## Non-Goals

- Do not declare production-stable release without live Postgres and Railway verification.
- Do not add app-specific job names, table names, UI concepts, or secrets to public packages.
- Do not publish to npm during this plan unless a later explicit user request approves publication.
- Do not add database triggers or hidden database-side automation.
- Do not add fallback code to hide missing secrets, missing state, invalid schemas, or failed provider calls.
