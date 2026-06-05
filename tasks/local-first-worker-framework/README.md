# BatonKit Framework Plan

> **For implementers:** Read this folder before writing code. Each phase document begins with the same operating rules. Follow those rules literally: complete one phase, commit it, review it, update the completed phase notes, then update future phase plans if implementation changed the design.

## Goal

Build a public npm package for small teams using Next.js/Vercel + Postgres that provides:

- a Postgres-backed job queue
- worker runtime
- local-first ownership
- heartbeat-based health tracking
- failover/failback to a cloud backup worker
- Next.js route-handler integration
- provider adapters, starting with Railway

## Target User

Small teams and solo developers running:

- Next.js on Vercel
- Postgres on Railway, Supabase, Neon, Render, or similar
- occasional heavy background work that does not need instant completion
- one local always-on-ish machine, such as a Mac mini, spare desktop, or office server

## Phase Index

1. `phase-01-project-foundation.md`
2. `phase-02-postgres-queue-core.md`
3. `phase-03-worker-runtime.md`
4. `phase-04-nextjs-control-plane.md`
5. `phase-05-local-first-failover.md`
6. `phase-06-public-package-readiness.md`

## Non-Goals For v1

- Do not build a Temporal-style workflow replay engine.
- Do not add DAG workflow authoring.
- Do not support Redis or SQLite in v1.
- Do not add Kubernetes orchestration.
- Do not add a full web dashboard in v1.
- Do not leak Redprint-specific job names, table names, or UI concepts into public APIs.

