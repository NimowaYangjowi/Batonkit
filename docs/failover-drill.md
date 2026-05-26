# Failover Drill

Use this drill before trusting failover in production.

Plain language: practice handing the baton to the backup worker before there is a real outage.

## Local Harness

Use the built-in Railway live drill harness when you want to test the baton handoff with a harmless `generate-preview` job and a real Postgres URL:

```bash
npm run drill:railway-live
```

Plain language: this command creates three safe practice jobs. The first must be finished by the local worker, the second by the backup worker, and the third by the local worker again after failback.

## Steps

1. Start the app and apply migrations.
2. Start the local worker.
3. Enqueue a harmless test job, such as `generate-preview`.
4. Confirm the local worker completes it.
5. Start the backup worker in passive mode.
6. Send a monitor `down` event.
7. Confirm ownership changes to `backup`.
8. Enqueue another harmless test job.
9. Confirm the backup worker completes it.
10. Send a monitor `up` event.
11. Wait for the failback cooldown.
12. Send another `up` event after cooldown.
13. Confirm ownership returns to `local`.

For the Railway-specific setup and command sequence, see `docs/railway-live-drill.md`.

## Safety Notes

- Use a non-destructive test job.
- Keep `maxAttempts` low during drills.
- Confirm backup secrets are separate from local secrets.
- Confirm passive backup workers cannot claim jobs while ownership is local.
