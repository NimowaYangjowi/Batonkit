# Railway Live Drill

Use this runbook to prove that BatonKit can hand background work from a local worker to a Railway backup worker and then hand it back again.

Plain language: this is the checklist for making sure the cloud backup worker can safely take over when the local machine goes down.

## Current Status

- Local harness proof: complete
- Railway project: `batonkit-lab`
- Railway backup service: `backup-worker`
- Railway Postgres: pending
- Public backup URL: pending
- Live Railway failover evidence: pending

## Harness Commands

Build the repo:

```bash
npm run build
```

Run the self-contained local drill against a real Postgres URL:

```bash
npm run drill:railway-live
```

Run a local worker:

```bash
BATONKIT_PLATFORM=local node examples/railway-live-drill/dist/worker.js
```

Run the backup worker HTTP service:

```bash
BATONKIT_PLATFORM=backup node examples/railway-live-drill/dist/server.js
```

Enqueue a harmless test job:

```bash
node examples/railway-live-drill/dist/drill.js enqueue
```

Trigger failover or failback:

```bash
node examples/railway-live-drill/dist/drill.js failover down
node examples/railway-live-drill/dist/drill.js failover up
```

## Railway Setup

1. Create or link the isolated Railway project:

```bash
railway init --name batonkit-lab --workspace "Jiwoo's Projects"
```

2. Create the backup worker service:

```bash
railway add --service backup-worker
```

3. Add Railway Postgres:

```bash
railway add --database postgres
```

4. Set service variables:

```txt
BATONKIT_DATABASE_URL=<Railway Postgres URL>
BATONKIT_CONTROL_SECRET=<test-only secret>
BATONKIT_PLATFORM=backup
BATONKIT_PORT=3000
```

5. Deploy the service from the repository root so the workspace packages are available:

```bash
railway up --service backup-worker
```

6. Generate a Railway domain after deployment:

```bash
railway domain --service backup-worker
```

## Initial Execution Notes

Observed on 2026-05-26:

- `railway init --name batonkit-lab --workspace "Jiwoo's Projects"` succeeded
- project id: `1fd9d32e-6a14-4b4b-941f-8a38fd3a19be`
- `railway add --service backup-worker` succeeded
- `railway add --database postgres` returned `Unauthorized. Please run railway login again.`
- `railway login -b` requested manual browser activation through `https://railway.com/activate`

Plain language: BatonKit's code and local drill harness are ready, but the real Railway practice run is currently blocked by Railway asking for a fresh browser login before it will let this machine add the test database.

## Cleanup

After the live drill is complete, either:

- delete the whole lab project with `railway delete`, or
- keep `batonkit-lab` intentionally and record why it remains active
