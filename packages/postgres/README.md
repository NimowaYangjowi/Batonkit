# @batonkit/postgres

Postgres-backed queue and control-plane store for BatonKit.

## Install

```bash
npm install @batonkit/core @batonkit/postgres
```

## What It Includes

- `postgresStore(...)` for the shared job queue
- `postgresControlStore(...)` for the shared baton state
- `createQueueMigrationSql()` for job tables
- `createControlPlaneMigrationSql()` for control-plane tables

If you are building the real multi-process setup from the BatonKit Quick Start, this is the package that provides the shared Postgres-backed data layer.

The Postgres queue preserves caller-provided job IDs from `enqueue(..., { id })`, matching the in-memory store behavior.
