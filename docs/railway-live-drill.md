# Railway Live Drill

Use this runbook to prove that BatonKit can hand background work from a local worker to a Railway backup worker and then hand it back again.

Plain language: this is the checklist for making sure the cloud backup worker can safely take over when the local machine goes down.

## Current Status

- Local harness proof: complete
- Railway project: `batonkit-lab`
- Railway backup service: `backup-worker`
- Railway Postgres: complete with `Postgres-jw1q`
- Public backup URL: `https://backup-worker-production-f754.up.railway.app`
- Live Railway failover evidence: complete on 2026-05-26 and refreshed on 2026-06-04

## Harness Commands

Build the repo:

```bash
npm run build
```

Run the self-contained local drill against a real Postgres URL:

```bash
npm run drill:railway-live
```

Run the real Railway-backed drill:

```bash
npm run drill:railway-live:remote
```

Run the automated drill checks:

```bash
npm run test -- examples/railway-live-drill/src/server.test.ts examples/railway-live-drill/src/drill.test.ts
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

If CLI provisioning fails, add Postgres from the Railway dashboard's `Add` flow.

4. Set service variables:

```txt
BATONKIT_DATABASE_URL=${{Postgres.DATABASE_URL}}
BATONKIT_CONTROL_SECRET=<test-only secret>
BATONKIT_PLATFORM=backup
BATONKIT_FAILBACK_COOLDOWN_MS=0
```

5. Deploy the service from the repository root so the workspace packages are available:

```bash
railway up --service backup-worker --detach
```

6. Generate or confirm a Railway domain after deployment:

```bash
railway domain --service backup-worker
```

7. Verify readiness:

```bash
curl https://backup-worker-production-f754.up.railway.app/ready
```

The public readiness response is intentionally minimal:

```json
{ "ok": true }
```

Use the bearer secret only when you need the detailed ownership snapshot:

```bash
curl -H "Authorization: Bearer $BATONKIT_CONTROL_SECRET" https://backup-worker-production-f754.up.railway.app/ready
```

Plain language: the public door only shows a green light. The private door shows the dashboard with worker name and baton owner.

## Observed Execution

Observed on 2026-05-26:

- `railway init --name batonkit-lab --workspace "Jiwoo's Projects"` succeeded
- project id: `1fd9d32e-6a14-4b4b-941f-8a38fd3a19be`
- `railway add --service backup-worker` succeeded
- Railway Postgres was created from the dashboard after CLI database creation returned an authorization error
- `railway variable set --service backup-worker --skip-deploys BATONKIT_DATABASE_URL='${{Postgres.DATABASE_URL}}' ...` succeeded
- `railway up --service backup-worker --detach` succeeded
- `curl https://backup-worker-production-f754.up.railway.app/ready` returned HTTP 200
- `npm run drill:railway-live:remote` completed successfully

Plain language: the real Railway backup worker has now been proven. It took the baton for the middle drill job and then gave it back to the local worker.

Observed on 2026-06-04:

- Existing Railway CLI access could update variables and deploy `backup-worker`, but could not provision a replacement Postgres service.
- The original `Postgres` service reported no deployment and could not be restarted or redeployed through CLI.
- A replacement Railway Postgres service, `Postgres-jw1q`, was created from the logged-in Railway dashboard.
- The replacement database accepted a local `select 1` probe through Railway's public TCP proxy.
- `backup-worker` was redeployed with `BATONKIT_DATABASE_URL=${{Postgres-jw1q.DATABASE_URL}}` and reached `SUCCESS`.
- `curl https://backup-worker-production-f754.up.railway.app/ready` returned `{ "ok": true }`.
- `npm run drill:railway-live:remote` completed successfully with ownership moving `local -> backup -> local`.

Plain language: when the old lab database door was broken, a new lab database was created and the full baton handoff was proven again.

## Automated Coverage

The repository now automatically checks:

- the public backup worker `/ready` endpoint returns only a minimal health response
- the authorized backup worker `/ready` endpoint returns the detailed ownership snapshot
- the authorized `/ready` endpoint rejects the wrong bearer secret
- the `/control-plane/refresh` endpoint rejects the wrong bearer secret
- the same refresh endpoint accepts the correct bearer secret and records a heartbeat
- refresh heartbeats preserve a degraded worker status instead of overwriting it as healthy
- both drill server doors return readable `500` JSON when the control-plane state cannot be read or refreshed
- the local practice drill hands the middle job from the local worker to the backup worker and back
- the remote drill waits for the backup worker to finish the middle job before returning ownership

Plain language: BatonKit now tests the important doors and baton handoff steps automatically, not just by manual rehearsal.

Provider note: in the Railway adapter, `park()` means "refresh the standby control-plane door again." It does not shut the Railway service down by itself.

## Known Limitations

- Railway CLI deploys and variable updates worked after login, but Postgres provisioning itself still needed the dashboard flow.
- The remote drill requires a public Railway URL so the provider can wake the backup worker through `/ready` and `/control-plane/refresh`.
- External Postgres access uses Railway's TCP proxy, so repeated drills should be mindful of connection limits and egress.

## Cleanup

After the live drill is complete, either:

- delete the whole lab project with `railway delete`, or
- keep `batonkit-lab` intentionally and record why it remains active

Current decision on 2026-05-26:

- retain `batonkit-lab` for repeatable BatonKit release checks

Current decision on 2026-06-04:

- retain `Postgres-jw1q` for repeatable BatonKit release checks
- clean up or explicitly retain the old offline `Postgres` service in the Railway lab project
