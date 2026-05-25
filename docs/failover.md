# Local-First Failover

Local-first failover moves job ownership from local workers to backup workers when a monitor reports that local workers are down.

Plain language: the local machine normally holds the baton. If it disappears, the backup cloud worker gets the baton.

## Flow

1. Monitor reports local worker `down`.
2. Control plane switches active owner to `backup`.
3. Backup provider wakes the cloud worker.
4. Backup worker can claim jobs.
5. Monitor reports local worker `up`.
6. Failback cooldown starts.
7. After cooldown, ownership returns to `local` and the provider parks the backup worker.

## Provider Interface

Providers implement:

- `wake()`
- `park()`

Railway is the first provider, but the interface is intentionally generic.

## Monitor Webhooks

`parseMonitorWebhookEvent()` accepts generic statuses:

- down: `down`, `failed`, `offline`
- up: `up`, `recovered`, `online`

