# Operations Runbook

Use this runbook when BatonKit is installed in a real app and the queue, worker, database, or backup provider needs attention.

## Failed Migrations

Symptoms:

- enqueueing fails because tables such as `lfw_jobs` or `lfw_control_state` do not exist
- the control route fails before reading ownership state
- Postgres errors mention missing relations or missing `gen_random_uuid`

Checks:

```sql
SELECT to_regclass('public.lfw_jobs');
SELECT to_regclass('public.lfw_control_state');
SELECT to_regclass('public.lfw_worker_heartbeats');
SELECT gen_random_uuid();
```

Recovery:

1. Stop new deploys that enqueue BatonKit jobs.
2. Run `createQueueMigrationSql()` and `createControlPlaneMigrationSql()` against the target database.
3. Confirm the default control row exists:

```sql
SELECT * FROM lfw_control_state WHERE id = 'default';
```

4. Restart workers after the schema is present.

Do not add database triggers as a workaround. BatonKit follow-up work should stay in visible app code, workers, jobs, or scheduled tasks.

## Stuck Leases

Symptoms:

- jobs stay `running` after the worker process is gone
- no worker completes or fails an old job
- a job is not claimable until its lease expires

Checks:

```sql
SELECT id, name, status, lease_owner, lease_expires_at, attempts, max_attempts
FROM lfw_jobs
WHERE status = 'running'
ORDER BY lease_expires_at ASC;
```

Recovery:

1. Confirm the worker named in `lease_owner` is actually stopped.
2. Wait for `lease_expires_at` if the lease is still valid.
3. If the worker is gone and the lease has expired, start a worker that has the matching job name in its `jobs` list.
4. If a job is repeatedly failing, inspect `lfw_job_events` before retrying.

## Degraded Workers

Symptoms:

- `lfw_worker_heartbeats.status` is `degraded`
- worker logs show polling loop or store errors
- the worker has not refreshed its heartbeat recently

Checks:

```sql
SELECT platform, worker_id, status, observed_at, updated_at
FROM lfw_worker_heartbeats
ORDER BY updated_at DESC;
```

Recovery:

1. Read worker logs for the first polling or store error.
2. Fix the earliest broken dependency, such as database connectivity, invalid schema, or missing job handler.
3. Restart the worker.
4. Confirm the heartbeat returns to `ok`.

## Provider Outages

Symptoms:

- `applyFailoverEvent(..., event: 'down')` fails while waking the backup provider
- Railway `/ready` returns a non-200 status
- `/control-plane/refresh` rejects the bearer secret

Checks:

```bash
curl "$BATONKIT_READY_URL"
curl -H "Authorization: Bearer $BATONKIT_CONTROL_SECRET" "$BATONKIT_READY_URL"
```

Recovery:

1. Confirm the backup service is deployed and healthy.
2. Confirm `BATONKIT_CONTROL_SECRET` matches on the app, monitor, and backup worker.
3. Confirm the backup worker can reach the same Postgres database as the local worker.
4. Retry the failover event after the provider is reachable.

## Failback Reconciliation

Symptoms:

- ownership stays `backup` after the local worker has recovered
- `failbackNotBefore` is in the past but ownership did not return to `local`

Checks:

```sql
SELECT mode, active_owner, failover_reason, failback_not_before, updated_at
FROM lfw_control_state
WHERE id = 'default';
```

Recovery:

1. Confirm the local worker is healthy and heartbeating.
2. Confirm your app or worker is calling `reconcileFailback(...)` on a timer.
3. Confirm the provider `park()` step succeeds.
4. After reconciliation, confirm `active_owner` is `local`.

## Secret And URL Safety

- Do not commit `BATONKIT_CONTROL_SECRET`.
- Do not commit private database URLs.
- Prefer service variable references such as `${{Postgres.DATABASE_URL}}` inside deployment platforms.
- Keep public health responses minimal; detailed ownership state should require bearer auth.

