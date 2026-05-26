# @batonkit/postgres

Postgres-backed queue and control-plane store for BatonKit.

Plain language: this is the package that turns BatonKit from a same-process demo into a real shared system. It stores the work queue and the baton state in Postgres so your app, your local worker, and your cloud backup worker can all look at the same source of truth.

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
