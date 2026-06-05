# BatonKit Third-Party Trust Hardening Plan

> **For implementers:** Read this folder before writing code. Each phase document begins with the same operating rules. Follow those rules literally: complete one phase, commit it, review it, update the completed phase notes, then update future phase plans if implementation changed the design.

## Goal

Harden BatonKit in the places where a third-party adopter is most likely to lose trust: worker liveness, queue behavior consistency, and control-plane input safety.

## Review Inputs

This plan is based on the 2026-05-27 project review findings:

- Worker runtimes can stop making progress after a store/runtime error while still appearing healthy.
- The in-memory queue silently overwrites caller-provided job IDs, while the Postgres queue rejects duplicates.
- The Next.js control-plane route trusts request body shape too much and can fail unclearly on malformed input.

## Target User

Small teams and solo developers using:

- Next.js or another app server that enqueues work
- Postgres as the shared queue and baton state
- one local worker as the normal background worker
- an optional cloud backup worker for outages

## Phase Index

1. `phase-01-worker-runtime-resilience.md`
2. `phase-02-job-id-parity.md`
3. `phase-03-control-plane-input-validation.md`
4. `phase-04-docs-and-release-confidence.md`

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

## Delivery Rules

- Keep each phase independently shippable.
- Commit each phase separately so regressions can be traced to one coherent product slice.
- At the end of each phase, run a review focused on regression risk, API clarity, overengineering, test gaps, docs gaps, performance/cost impact, security impact, and public-package ergonomics.
- Update the completed phase document before moving to the next phase.
- If implementation changes the design, update later phase documents before starting them.

## Non-Goals

- Do not add a dashboard.
- Do not add new queue backends.
- Do not add product-specific job names, table names, UI concepts, or deployment secrets.
- Do not turn BatonKit into a workflow engine.
