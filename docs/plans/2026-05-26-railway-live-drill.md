# BatonKit Railway Live Drill Implementation Plan

> **For implementers:** Execute `tasks/railway-live-drill/` phase documents in order. Each phase must be committed, reviewed, and used to update later phases before continuing.

**Goal:** Validate BatonKit against a real Railway project with Postgres-backed queue and control state, live backup worker processing, and documented failover/failback evidence.

**Architecture:** Add durable Postgres control state first, then create a small live drill harness that can run locally and on Railway. Use Railway only through the provider adapter and keep BatonKit core provider-neutral.

**Tech Stack:** TypeScript, Node.js, Postgres, Railway CLI, Railway Postgres, BatonKit packages, Vitest, Docker for local Postgres verification.

---

## Phase Documents

- `tasks/railway-live-drill/phase-01-postgres-control-store.md`
- `tasks/railway-live-drill/phase-02-live-drill-harness.md`
- `tasks/railway-live-drill/phase-03-railway-project-setup.md`
- `tasks/railway-live-drill/phase-04-live-failover-execution.md`
- `tasks/railway-live-drill/phase-05-docs-and-release-gate.md`

## Global Rule

This live drill must prove provider behavior without making Railway a hard dependency of BatonKit. Railway is the first live provider, not the framework's center.

