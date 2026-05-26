# API Reference

## `@batonkit/core`

### `createJobs({ store })`

Creates a job client.

Methods:

- `enqueue(name, payload, options?)`
- `claimNext({ workerId, leaseMs, names? })`
- `complete(id)`
- `fail(id, error)`
- `get(id)`

### `createMemoryStore()`

In-memory `JobStore` for tests and examples.

### `createMemoryControlStore()`

In-memory `ControlStore` for tests and examples.

### `createGatedStore(store, control, platform)`

Wraps a job store so only the active owner can claim jobs.

### `applyFailoverEvent(input)`

Applies a monitor `down` or `up` event to the control plane.

## `@batonkit/postgres`

### `createQueueMigrationSql()`

Returns SQL for `lfw_jobs` and `lfw_job_events`.

### `createControlPlaneMigrationSql()`

Returns SQL for `lfw_control_state` and `lfw_worker_heartbeats`.

### `postgresControlStore(queryClient)`

Creates a durable `ControlStore` backed by Postgres for ownership and heartbeat state.

### `postgresStore(queryClient)`

Creates a `JobStore` from a minimal query client.

## `@batonkit/worker`

### `defineJob(name, handler)`

Defines a job handler.

### `createWorker(options)`

Creates a worker runtime with:

- `start()`
- `stop()`
- `runOnce()`
- `runBatch()`

Workers claim only the job names registered in `options.jobs`.

## `@batonkit/next`

### `createControlPlaneHandlers({ control, secret })`

Returns `GET` and `POST` handlers compatible with Next.js App Router route files.

## `@batonkit/provider-railway`

### `railwayProvider({ readyUrl, refreshSecret, fetch? })`

Creates a backup provider that checks readiness and refreshes the backup worker control plane.

## `@batonkit/monitor-webhook`

### `parseMonitorWebhookEvent(body)`

Parses generic monitor payloads into `down` or `up` failover events.

Supports either `body.status` or `body.event` with values such as:

- down: `down`, `failed`, `offline`
- up: `up`, `recovered`, `online`
