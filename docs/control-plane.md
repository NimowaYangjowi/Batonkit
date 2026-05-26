# Control Plane

The control plane decides which platform may claim jobs.

Plain language: it is the traffic light for background workers. When the local worker owns the light, the backup worker must wait.

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

export const { GET, POST } = createControlPlaneHandlers({
  control,
  secret: process.env.LOCALFIRST_WORKER_SECRET,
});
```

`POST` requires `Authorization: Bearer <secret>`.

