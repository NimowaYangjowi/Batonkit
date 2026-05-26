# Control Plane

The control plane decides which platform may claim jobs.

Plain language: it is the traffic light for background workers. When the local worker owns the light, the backup worker must wait.

## Stores

- `createMemoryControlStore()`: useful for tests, examples, and single-process demos
- `postgresControlStore(queryClient)`: useful when your Next.js app, local worker, and backup worker must share durable ownership and heartbeat state through Postgres

Plain language: use the memory version when everything is happening inside one toy setup. Use the Postgres version when the app server and the backup worker are separate machines and both need to read the same baton state.

## Ownership

- `local_primary`: local workers may claim jobs
- `backup_active`: backup workers may claim jobs
- `maintenance_override`: reserved for manual operator control

## Heartbeats

Workers should report:

- platform: `local` or `backup`
- worker id
- health status
- observed time

## Next.js Route Helpers

```ts
import { createControlPlaneHandlers } from '@batonkit/next';
import { postgresControlStore } from '@batonkit/postgres';

export const { GET, POST } = createControlPlaneHandlers({
  control: postgresControlStore(db),
  secret: process.env.BATONKIT_CONTROL_SECRET!,
});
```

`GET` and `POST` require `Authorization: Bearer <secret>` by default.

`POST` accepts two JSON body shapes:

- heartbeat updates:

```json
{
  "type": "heartbeat",
  "platform": "local",
  "workerId": "office-mac-mini",
  "status": "ok"
}
```

- ownership updates:

```json
{
  "type": "ownership",
  "mode": "backup_active",
  "activeOwner": "backup",
  "failoverReason": "monitor_down"
}
```

Malformed JSON or missing/invalid required fields now return `400` instead of falling through to deeper runtime or store errors.

Pass `publicRead: true` only when it is safe for anyone with the route URL to see ownership and heartbeat state.

Plain language: the status door is locked by default because it can reveal which worker is active and which worker checked in recently.

Plain language: the control door now also checks whether the form you handed in is filled out correctly before it sends that form into the control room.
