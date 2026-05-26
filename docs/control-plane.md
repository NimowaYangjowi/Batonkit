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
  secret: process.env.LOCALFIRST_WORKER_SECRET,
});
```

`POST` requires `Authorization: Bearer <secret>`.
