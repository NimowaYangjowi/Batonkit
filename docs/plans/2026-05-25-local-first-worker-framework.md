# Local First Worker Framework Implementation Plan

> **For implementers:** Execute the phase documents in `tasks/local-first-worker-framework/` in order. Each phase must be committed, reviewed, and used to update later phases before continuing.

**Goal:** Build a public npm package for local-first background workers with Postgres queueing and cloud backup failover.

**Architecture:** Use Postgres as the v1 queue/control store, a Node.js worker runtime for local and cloud workers, Next.js route helpers for control-plane endpoints, and provider adapters for backup-worker wake/park behavior. Start with Railway as the first provider while keeping the provider interface generic.

**Tech Stack:** TypeScript, Node.js, Next.js App Router helpers, Postgres, Vitest, npm workspaces or another lightweight TypeScript monorepo setup.

---

## Phase Documents

- `tasks/local-first-worker-framework/phase-01-project-foundation.md`
- `tasks/local-first-worker-framework/phase-02-postgres-queue-core.md`
- `tasks/local-first-worker-framework/phase-03-worker-runtime.md`
- `tasks/local-first-worker-framework/phase-04-nextjs-control-plane.md`
- `tasks/local-first-worker-framework/phase-05-local-first-failover.md`
- `tasks/local-first-worker-framework/phase-06-public-package-readiness.md`

## Global Rule

The framework is public-package-first. Redprint may validate the package, but the package must not depend on Redprint's schema, job names, UI names, deployment secrets, or business logic.

