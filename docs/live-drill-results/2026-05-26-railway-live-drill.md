# 2026-05-26 Railway Live Drill

## Summary

- Project: `batonkit-lab`
- Project id: `1fd9d32e-6a14-4b4b-941f-8a38fd3a19be`
- Backup service: `backup-worker`
- Backup public URL: `https://backup-worker-production-f754.up.railway.app`
- Postgres public proxy: `zephyr.proxy.rlwy.net:58262`
- Result: pass

Plain language: the cloud backup worker really did take over the harmless middle job, and the local worker took control back afterward.

## Commands

```bash
railway init --name batonkit-lab --workspace "Jiwoo's Projects"
railway add --service backup-worker
railway up --service backup-worker --detach
curl https://backup-worker-production-f754.up.railway.app/ready
npm run drill:railway-live:remote
```

## Evidence

- `/ready` response:

```json
{"ok":true,"platform":"backup","workerId":"backup-drill-worker","ownership":"local","mode":"local_primary"}
```

- Remote drill result:

```json
{
  "ok": true,
  "mode": "remote",
  "readyUrl": "https://backup-worker-production-f754.up.railway.app/ready",
  "initialOwner": "local",
  "ownerAfterDown": "backup",
  "ownerAfterUp": "local",
  "jobIds": [
    "job_f7429052-d1ea-4e07-8c9c-8c8998ba395c",
    "job_1caae0b8-9005-4b81-85ec-46d5dd0bbf27",
    "job_32b73096-1449-4499-9509-597386594d2f"
  ],
  "failedOver": "failed_over",
  "restored": "restored_local",
  "finalOwner": "local"
}
```

- Backup worker log excerpt:

```text
[backup:backup-drill-worker] Processed drill job {
  jobId: 'job_1caae0b8-9005-4b81-85ec-46d5dd0bbf27',
  payload: { fileId: 'live-job-b', screenLabel: 'Live job B' },
  visibleTask: 'generate-preview'
}
```

- Final database snapshot:

```json
{
  "jobs": [
    {
      "id": "job_f7429052-d1ea-4e07-8c9c-8c8998ba395c",
      "status": "completed"
    },
    {
      "id": "job_1caae0b8-9005-4b81-85ec-46d5dd0bbf27",
      "status": "completed"
    },
    {
      "id": "job_32b73096-1449-4499-9509-597386594d2f",
      "status": "completed"
    }
  ],
  "control": {
    "mode": "local_primary",
    "active_owner": "local"
  }
}
```

## Resource Status

- `batonkit-lab` project: retained
- `backup-worker` service: retained
- Railway Postgres: retained

## Notes

- Railway CLI deploys and variable updates worked after login, but Postgres provisioning itself still needed the dashboard flow.
- The backup worker passed the Railway `/ready` healthcheck and listened on Railway's assigned runtime port.
