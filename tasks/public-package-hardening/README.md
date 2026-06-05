# BatonKit Public Package Hardening Plan

> **For implementers:** Read this folder before writing code. Each phase document begins with the same operating rules. Follow those rules literally: complete one phase, commit it, review it, update the completed phase notes, then update future phase plans if implementation changed the design.

## Goal

Harden BatonKit from a developer-preview package skeleton into a more trustworthy public npm package.

## Review Inputs

This plan is based on the project review findings from 2026-05-27:

- Worker runtimes can currently claim and fail jobs that they do not know how to handle.
- Failback after a cooldown needs clearer automatic restoration behavior.
- Worker heartbeat behavior is documented as part of the runtime but is not exposed by the public worker runtime API.
- Public API behavior differs between memory and Postgres stores for caller-provided job IDs.
- Next.js control-plane read endpoints expose operational state without authentication.
- Public docs need to reflect the true maturity level and the exact operational responsibilities users must wire up.

## Target User

Small teams and solo developers using:

- Next.js or another web app that can enqueue work
- Postgres as the shared queue and baton state
- a local worker as the normal background worker
- an optional cloud backup worker for outages

## Phase Index

1. `phase-01-worker-claim-safety.md`
2. `phase-02-automatic-failback.md`
3. `phase-03-worker-heartbeats.md`
4. `phase-04-api-parity-and-control-security.md`
5. `phase-05-docs-release-readiness.md`

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

## Non-Goals

- Do not add a full dashboard.
- Do not add Redis, SQLite, or multi-store abstractions.
- Do not build Temporal-style workflow replay.
- Do not make Railway required by core packages.
- Do not introduce product-specific schemas, job names, UI concepts, or secrets.

