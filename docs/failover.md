# Local-First Failover

Local-first failover moves job ownership from local workers to backup workers when a monitor reports that local workers are down.

## Flow

1. Monitor reports local worker `down`.
2. Control plane switches active owner to `backup`.
3. Backup provider wakes the cloud worker.
4. Backup worker can claim jobs.
5. Monitor reports local worker `up`.
6. Failback cooldown starts.
7. A scheduled reconciliation call checks whether the cooldown has elapsed.
8. After cooldown, ownership returns to `local` and the provider runs its `park()` step to put the backup side back into standby if that provider supports it.

## Provider Interface

Providers implement:

- `wake()`
- `park()`

Railway is the first provider, but the interface is intentionally generic.

## Monitor Webhooks

`parseMonitorWebhookEvent()` accepts generic statuses:

- down: `down`, `failed`, `offline`
- up: `up`, `recovered`, `online`

It will read those values from either `body.status` or `body.event`.

## External Monitor Dependency

BatonKit does not require HetrixTools specifically.

You can use any monitoring tool if it can do one of these:

- send a webhook that already includes a generic up/down style status BatonKit understands
- send a webhook that your app can translate into BatonKit's generic `down` or `up` event before handing it to the control plane

For example, a small Next.js route can:

1. receive the raw webhook from your monitoring dashboard
2. map the vendor's payload into `down` or `up`
3. call `applyFailoverEvent(...)`

## Failback Reconciliation

`applyFailoverEvent({ event: 'up', ... })` starts the failback cooldown when local is healthy again. `reconcileFailback(...)` should then run periodically from a cron, route, or worker-side loop. It restores local ownership only after `failbackNotBefore` has passed.

## What To Test

Repository tests already prove:

- BatonKit can parse generic monitor statuses
- BatonKit can switch ownership on `down`
- BatonKit can start failback cooldown on `up`
- BatonKit can restore ownership after cooldown through failback reconciliation

Repository tests do not prove:

- that HetrixTools specifically sends the payload shape you expect
- that UptimeRobot specifically sends the payload shape you expect
- that your public webhook route, auth, and monitor dashboard are wired correctly

Recommended release check:

- do not block every code change on a live test of every monitoring vendor
- do run at least one end-to-end test with the actual monitoring tool you plan to use before trusting production failover
