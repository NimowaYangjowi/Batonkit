# @batonkit/core

Core queue contracts and control-plane primitives for BatonKit.

Plain language: this is the package that gives you the shared job queue rules, the in-memory demo queue, and the "who should work right now?" baton logic that decides whether the local worker or the backup worker is allowed to pick up jobs.

## Install

```bash
npm install @batonkit/core
```

## What It Includes

- queue and job contracts
- `createJobs(...)` for enqueueing work from your app
- `createMemoryStore()` for local demos and tests
- `createGatedStore(...)` for enforcing local-versus-backup ownership

Use this together with `@batonkit/postgres` when you want a real shared Postgres-backed queue instead of an in-memory demo setup.
