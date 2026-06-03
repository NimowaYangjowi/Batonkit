# Phase 03: Required Verification Gates

> **Phase Operating Rules**
>
> - Keep this phase independently shippable and commit it when complete.
> - At phase end, run a review focused on regression risk, API clarity, overengineering, test gaps, docs gaps, performance/cost impact, security impact, and public-package ergonomics.
> - Record review findings in this phase document under `Phase Review`.
> - Update the completion checklist in this phase document before moving on.
> - If implementation changes the architecture, update all later phase documents before starting the next phase.
> - If implementation changes what was completed, update the completed plan notes in this phase before committing.
> - Commit this phase separately from later phases so regressions can be traced to one coherent product slice.
> - Do not carry product-specific names, database tables, job types, deployment secrets, or UI concepts into the public API.
> - Do not add fallback code just to make a check pass. Fix the earliest correct source of missing or invalid state.
> - When using `/ship`, do not run the full workflow from `main`; switch to a `codex/` feature branch first.

## Goal

Run and record every release gate that blocked the productization decision: real Postgres integration, package installability, simulated failover, local Railway drill, and remote Railway-backed drill.

Plain language: this phase proves the queue works with a real database and proves the backup-worker handoff works outside a toy unit test.

## User-Facing Risk

Without these checks, BatonKit can only be called a developer preview. A real adopter needs proof that the shared Postgres tables, worker ownership, and Railway provider path work together.

Plain language: the small test car worked on the desk. This phase drives the real car around the block.

## Files

- Modify: `docs/railway-live-drill.md` if new live evidence changes the runbook
- Modify: `docs/live-drill-results/*` if a new proof run is recorded
- Modify: this phase document
- Do not commit secrets or private database URLs

## Tasks

1. Start Docker Desktop or another Docker daemon that can run the Postgres integration container.
2. Run:

```bash
npm run test:postgres
```

3. Run the complete local package and failover checks:

```bash
npm run test:pack
npm run drill:failover
```

4. Prepare live drill environment variables without committing them:

```bash
export BATONKIT_CONTROL_SECRET=<test-only secret>
export BATONKIT_DATABASE_URL=<isolated drill postgres url>
export BATONKIT_READY_URL=<deployed backup worker ready url>
```

5. Run the local Railway live-drill harness:

```bash
npm run build
npm run drill:railway-live
```

6. Run the remote Railway-backed drill:

```bash
npm run drill:railway-live:remote
```

7. Record command results, timestamps, provider URL safety notes, and whether resources were cleaned up or intentionally retained.
8. If any command fails, do not paper over it. Reproduce the failure, identify whether the first bad value is environment, schema, provider readiness, control-plane auth, or worker runtime, then fix that source in a new phase update.
9. Review this phase and update `Phase Review`.
10. Commit:

```bash
git add docs/railway-live-drill.md docs/live-drill-results tasks/productization-readiness-release/phase-03-required-verification-gates.md
git commit -m "docs: record productization verification gates"
```

If no docs outside this phase changed, commit only this phase document.

## Acceptance Criteria

- `npm run test:postgres` passes with a real Postgres container.
- `npm run test:pack` passes.
- `npm run drill:failover` passes.
- `npm run drill:railway-live` passes with an isolated drill database.
- `npm run drill:railway-live:remote` passes against the deployed backup worker.
- No secrets, private URLs, or production database credentials are committed.
- Verification evidence is recorded.
- The phase is reviewed, documented, and committed separately.

## Phase Review

- Status: complete. Remote Railway-backed failover proof now passes against `backup-worker` and the new `Postgres-jw1q` lab database.
- Regression risk: low. Verification commands exercised existing queue, package, Postgres, and failover behavior without introducing code changes in this phase.
- API clarity: unchanged. No public API behavior changed in this phase.
- Overengineering: avoided. The local live-drill harness used an isolated temporary Docker Postgres database rather than adding a new test path.
- Test gaps: addressed for the planned gates. Docker-backed Postgres integration, pack smoke, simulated failover, local Railway drill, and remote Railway drill all passed.
- Docs gaps: this document now records the original blockers, the dashboard-created replacement Postgres service, and the final remote proof result.
- Performance/cost impact: small lab infrastructure impact. A new Railway Postgres service, `Postgres-jw1q`, was created for repeatable release checks; the old offline `Postgres` service remains in the lab project and should be cleaned up or explicitly retained.
- Security impact: neutral. Test-only secrets were generated and set through Railway variables; no secret values were committed.
- Public-package ergonomics: improved because the package now has current live provider proof, not only a historical 2026-05-26 proof.
- Later phase update: Phase 04 may now update beta readiness language using the completed remote Railway proof.

## Completion Notes

- Docker Desktop was initially installed but the daemon was not ready. It was started with `open -a Docker`, then Docker became available.
- Verification commands:

```bash
npm run test:postgres          # passed: 1 integration file, 2 tests
npm run test:pack              # passed
npm run drill:failover         # passed
npm run drill:railway-live     # passed with temporary local Docker Postgres
npm run drill:railway-live:remote # passed after Railway Postgres replacement
```

- Local Railway drill evidence:

```text
failedOver: failed_over
restored: restored_local
finalOwner: local
```

- Initial remote Railway-backed drill blocker:

```text
Missing required BatonKit env var: BATONKIT_CONTROL_SECRET
```

- Follow-up on 2026-06-04:

- Generated a new test-only `BATONKIT_CONTROL_SECRET`.
- Set `backup-worker` Railway variables for `BATONKIT_CONTROL_SECRET`, `BATONKIT_PLATFORM=backup`, `BATONKIT_FAILBACK_COOLDOWN_MS=0`, and `BATONKIT_DATABASE_URL`.
- First set `BATONKIT_DATABASE_URL` to `${{Postgres.DATABASE_URL}}`; deployment failed because the backup worker could not resolve `postgres.railway.internal`.
- Then set `BATONKIT_DATABASE_URL` to `${{Postgres.DATABASE_PUBLIC_URL}}`; deployment still failed because Postgres public proxy connections returned `ECONNRESET`.
- Verified locally with Node `pg` that `DATABASE_PUBLIC_URL` also returns `ECONNRESET`, so the failure is not limited to the backup worker container.
- `railway service status --service Postgres` reports `No deployment`.
- `railway service restart --service Postgres --yes` and `railway service redeploy --service Postgres --yes` both report `No deployment found for service`.
- Attempting to add a new Railway Postgres database with `railway add --database postgres --json` failed with:

```text
Unauthorized. Please run `railway login` again.
```

- Current blocker: Railway CLI can read and update the existing lab project, but cannot provision a replacement Postgres database, and the existing Postgres service cannot be restarted or redeployed through CLI because it has no deployment.

- Dashboard follow-up on 2026-06-04:

- Used the logged-in Railway dashboard through Codex Chrome Extension to add a new PostgreSQL database service.
- New lab database service: `Postgres-jw1q`.
- Verified `Postgres-jw1q` status: `SUCCESS`.
- Verified new public Postgres proxy locally with Node `pg`: `select 1` returned `ok=1`.
- Set `backup-worker` `BATONKIT_DATABASE_URL` to `${{Postgres-jw1q.DATABASE_URL}}`.
- Redeployed `backup-worker`; deployment `02779f06-72cd-4b89-81a6-298ace3efc4c` reached `SUCCESS`.
- Verified public readiness:

```bash
curl https://backup-worker-production-f754.up.railway.app/ready
# {"ok":true}
```

- Remote Railway drill result:

```text
mode: remote
initialOwner: local
ownerAfterDown: backup
ownerAfterUp: local
failedOver: failed_over
restored: restored_local
finalOwner: local
jobIds:
- job_f294c837-9a3b-4984-a76a-ee196ed01892
- job_964c4073-11fe-4a7a-9257-5bb6ce65fe35
- job_85d1e0a8-31b5-47d0-af9a-1151fbedebaf
```

## Completion Checklist

- [x] Docker-backed Postgres integration passes
- [x] Pack consumer smoke passes
- [x] Simulated failover drill passes
- [x] Local Railway live drill passes
- [x] Remote Railway live drill passes
- [x] Verification evidence recorded
- [x] Secrets checked before commit
- [x] Phase review completed
- [x] Phase document updated
- [x] Later phase documents updated if needed
- [x] Phase committed
