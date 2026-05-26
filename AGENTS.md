# BatonKit Agent Guide

## Product Boundary

BatonKit is a public npm package for small Next.js/Vercel + Postgres teams that want local-first background jobs with optional cloud backup failover.

Do not add app-specific concepts to public APIs. Examples may use generic tasks such as `generate-preview`, but core packages must not depend on any single product's schema, UI, secrets, or deployment.

Plain language: BatonKit is the reusable tool, not one customer's private workshop.

## First Files To Read

1. `README.md`
2. `docs/api-reference.md`
3. `docs/queue-core.md`
4. `docs/worker-runtime.md`
5. `docs/control-plane.md`
6. `docs/failover.md`
7. `tasks/local-first-worker-framework/README.md`

## Package Map

- `packages/core`: queue contracts, memory store, control plane, failover decisions
- `packages/postgres`: Postgres migration SQL and query-client store
- `packages/worker`: job definitions and worker runtime
- `packages/next`: Next.js route-handler helpers
- `packages/provider-railway`: Railway backup provider adapter
- `packages/monitor-webhook`: generic monitor webhook parser
- `examples/next-postgres`: separate example app; install it from its own folder

## Required Verification

Run these before considering work complete:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

For changes touching Postgres behavior, also run:

```bash
npm run test:postgres
```

For package export or installability changes, also run:

```bash
npm run test:pack
```

For failover behavior changes, also run:

```bash
npm run drill:failover
```

For Railway live drill harness changes, also run:

```bash
npm run drill:railway-live
```

## Implementation Rules

- Write tests before behavior changes.
- Keep public API names generic and stable.
- Prefer Postgres-first v1 behavior over broad storage abstractions.
- Keep provider APIs platform-neutral; Railway is one adapter, not the framework's center.
- Do not hide failed jobs with silent fallbacks.
- Update docs when public behavior changes.
- Commit each completed phase or coherent product slice separately.

## Release Caution

Do not publish to npm until:

- live Postgres integration tests pass
- `npm pack` consumer smoke tests pass
- failover drill passes
- package names and scope are confirmed
- README has a copy-pasteable tutorial
