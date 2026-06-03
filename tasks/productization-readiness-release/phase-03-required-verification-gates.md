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

- Status: blocked on Railway Postgres service availability and Railway database-provisioning permission.
- Regression risk: low so far. Verification commands exercised existing queue, package, Postgres, and failover behavior without introducing code changes in this phase.
- API clarity: unchanged. No public API behavior changed in this phase.
- Overengineering: avoided. The local live-drill harness used an isolated temporary Docker Postgres database rather than adding a new test path.
- Test gaps: one required release gate remains unverified: `npm run drill:railway-live:remote`.
- Docs gaps: this document now records which gates passed, which generated values were set, and which Railway service issue still blocks remote proof.
- Performance/cost impact: neutral. Temporary Docker Postgres was used for verification and stopped after the local drill.
- Security impact: neutral. A test-only local drill secret was used and no secrets were committed.
- Public-package ergonomics: improved because the real blocker is now explicit: remote Railway proof needs a working Railway Postgres service, not just generated env values.
- Later phase update: Phase 04 release metadata must not claim public beta readiness until the remote Railway-backed drill passes or the decision is explicitly downgraded to private preview only.

## Completion Notes

- Docker Desktop was initially installed but the daemon was not ready. It was started with `open -a Docker`, then Docker became available.
- Verification commands:

```bash
npm run test:postgres          # passed: 1 integration file, 2 tests
npm run test:pack              # passed
npm run drill:failover         # passed
npm run drill:railway-live     # passed with temporary local Docker Postgres
npm run drill:railway-live:remote # blocked: missing BATONKIT_CONTROL_SECRET
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

Required state to continue:

```bash
export BATONKIT_CONTROL_SECRET=<test-only remote refresh secret already set on backup-worker>
export BATONKIT_DATABASE_URL=<working Railway Postgres public url>
export BATONKIT_READY_URL=<deployed backup worker ready url>
```

## Completion Checklist

- [x] Docker-backed Postgres integration passes
- [x] Pack consumer smoke passes
- [x] Simulated failover drill passes
- [x] Local Railway live drill passes
- [ ] Remote Railway live drill passes
- [x] Verification evidence recorded
- [x] Secrets checked before commit
- [x] Phase review completed
- [x] Phase document updated
- [x] Later phase documents updated if needed
- [x] Phase committed
