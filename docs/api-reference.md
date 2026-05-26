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

`enqueue` options include:

- `id`: optional caller-provided job id
- `runAt`: optional time when the job becomes claimable
- `maxAttempts`: optional retry limit

If you pass `id`, both the memory store and Postgres store reject duplicate enqueues that reuse the same caller-provided job id.

### `createMemoryStore()`

In-memory `JobStore` for tests and examples.

### `createMemoryControlStore()`

In-memory `ControlStore` for tests and examples.

### `createGatedStore(store, control, platform)`

Wraps a job store so only the active owner can claim jobs.

### `applyFailoverEvent(input)`

Applies a monitor `down` or `up` event to the control plane.

### `reconcileFailback(input)`

Checks whether a pending failback cooldown has elapsed and restores local ownership when it is safe to do so.

## `@batonkit/postgres`

### `createQueueMigrationSql()`

Returns SQL for `lfw_jobs` and `lfw_job_events`.

### `createControlPlaneMigrationSql()`

Returns SQL for `lfw_control_state` and `lfw_worker_heartbeats`.

### `postgresControlStore(queryClient)`

Creates a durable `ControlStore` backed by Postgres for ownership and heartbeat state.

### `postgresStore(queryClient)`

Creates a `JobStore` from a minimal query client. It preserves caller-provided job ids from `enqueue(..., { id })`.

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

Optional heartbeat fields:

- `control`: control store that receives worker heartbeats
- `platform`: `local` or `backup`
- `heartbeatIntervalMs`: heartbeat refresh interval, default `30000`
- `heartbeatStatus`: health status to report, default `ok`

When the worker's main polling loop hits an unhandled runtime or store error, later heartbeat refreshes report `degraded` until the worker is stopped.

## `@batonkit/next`

### `createControlPlaneHandlers({ control, secret })`

Returns `GET` and `POST` handlers compatible with Next.js App Router route files.

`GET` and `POST` require `Authorization: Bearer <secret>` by default. Pass `publicRead: true` only when control-plane state is safe to expose publicly.

`POST` accepts:

- `type: "heartbeat"` with `platform`, `workerId`, and optional `status` / `observedAt`
- `type: "ownership"` with `mode`, `activeOwner`, and optional `failoverReason` / `failbackNotBefore`

Malformed JSON and invalid request bodies return `400`.

## `@batonkit/provider-railway`

### `railwayProvider({ readyUrl, refreshSecret, fetch? })`

Creates a backup provider that checks readiness and refreshes the backup worker control plane.

## `@batonkit/monitor-webhook`

### `parseMonitorWebhookEvent(body)`

Parses generic monitor payloads into `down` or `up` failover events.

Supports either `body.status` or `body.event` with values such as:

- down: `down`, `failed`, `offline`
- up: `up`, `recovered`, `online`
