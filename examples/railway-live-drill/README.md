# Railway Live Drill Harness

This example is a tiny BatonKit practice field for the Railway live drill.

Plain language: it gives you a safe fake job called `generate-preview`, a local worker process, a backup worker service, and commands that let you watch the baton move between them.

## Environment Variables

- `BATONKIT_DATABASE_URL`: Postgres URL for the shared queue and control-plane tables
- `BATONKIT_CONTROL_SECRET`: bearer secret for the backup worker refresh endpoint
- `BATONKIT_PLATFORM`: `local` or `backup` for the worker process
- `BATONKIT_PORT`: HTTP port for the backup worker service, default `3000`
- `BATONKIT_READY_URL`: optional public backup service URL used by manual failover commands
- `BATONKIT_WORKER_ID`: optional worker label shown in logs
- `BATONKIT_FAILBACK_COOLDOWN_MS`: optional failback cooldown for drills, default `0`

## Commands

Build the harness:

```bash
npm run build
```

Run the self-contained local drill:

```bash
npm run drill:railway-live
```

Run a local worker process against the shared Postgres queue:

```bash
BATONKIT_PLATFORM=local node examples/railway-live-drill/dist/worker.js
```

Run the backup HTTP service that Railway should expose:

```bash
BATONKIT_PLATFORM=backup node examples/railway-live-drill/dist/server.js
```

Enqueue one harmless test job:

```bash
node examples/railway-live-drill/dist/drill.js enqueue
```

Trigger failover or failback using the shared control store and optional Railway provider:

```bash
node examples/railway-live-drill/dist/drill.js failover down
node examples/railway-live-drill/dist/drill.js failover up
```
