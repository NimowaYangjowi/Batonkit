# Phase 04: Live Failover Execution

> **Phase Operating Rules**
>
> - Keep this phase independently shippable and commit it when complete.
> - At phase end, run a review focused on regression risk, API clarity, overengineering, test gaps, docs gaps, performance/cost impact, secret safety, and public-package ergonomics.
> - Record review findings in this phase document under `Phase Review`.
> - Update the completion checklist in this phase document before moving on.
> - If implementation changes the architecture, update all later phase documents before starting the next phase.
> - Do not carry any product-specific names, database tables, job types, deployment secrets, or UI concepts into the public API.
> - Keep Railway as one provider adapter; do not make Railway required by core.
> - Use TDD for code behavior changes; for live drill steps, record exact commands, timestamps, URLs, and observed outcomes.

## Goal

Run the actual live failover and failback drill against `batonkit-lab`.

## Files

- Update: `docs/railway-live-drill.md`
- Create: `docs/live-drill-results/YYYY-MM-DD-railway-live-drill.md`
- Update this phase document

## Drill Steps

1. Start local worker against Railway Postgres.
2. Ensure ownership is `local`.
3. Enqueue job A.
4. Confirm local worker processes job A.
5. Trigger `down` event through the BatonKit failover command.
6. Confirm ownership is `backup`.
7. Wake Railway backup through provider.
8. Enqueue job B.
9. Confirm Railway backup worker processes job B.
10. Trigger `up` event.
11. Wait cooldown or use zero-cooldown test mode.
12. Confirm ownership returns to `local`.
13. Enqueue job C.
14. Confirm local worker processes job C.

## Required Evidence

Record:

- command outputs
- job ids
- ownership snapshots
- Railway service URL
- backup worker log excerpt
- local worker log excerpt
- final resource status

## Commands To Run

Exact command names may change after Phase 02, but the drill must include:

```bash
npm run build
npm run typecheck
npm run test
npm run test:postgres
npm run test:pack
npm run drill:failover
npm run lint
npm audit --omit=dev
```

And the live drill command, for example:

```bash
npm run drill:railway-live:remote
```

## Acceptance Criteria

- Real Railway backup worker processes at least one job.
- Ownership changes are persisted in Railway Postgres.
- Local worker is blocked while backup owns work.
- Backup worker is blocked after failback to local.
- All secrets used are test-only.
- Results document is committed.

## Phase Review

- Regression risk: medium-low. The new remote drill command resets drill tables before running, which is appropriate for the isolated lab project but should not be pointed at shared production data.
- API clarity: improved. The live drill now has a dedicated command for the real user-facing flow where the local machine owns jobs first and the Railway backup worker only handles the middle failover job.
- Overengineering: avoided. The implementation reuses the existing local runtime and provider wake path instead of inventing a separate test harness protocol.
- Test gaps: acceptable for this phase. The live drill result document captures the job ids, ownership transitions, readiness response, and backup worker log excerpt from the real Railway run.
- Docs gaps: addressed in `docs/railway-live-drill.md` and `docs/live-drill-results/2026-05-26-railway-live-drill.md`.
- Performance/cost impact: low but real. The live drill uses Railway TCP proxy access for the local side and leaves the lab resources retained for future release checks.
- Secret safety: satisfied. Only test-only secrets and the isolated BatonKit lab project were used.
- Public-package ergonomics: improved because users now have a proven reference path for a real provider drill.

## Completion Checklist

- [x] Local worker processed job A
- [x] Ownership failed over to backup
- [x] Railway backup processed job B
- [x] Ownership failed back to local
- [x] Local worker processed job C
- [x] Results document completed
- [x] Verification commands pass
- [x] Phase review completed
- [x] Phase committed
- [x] Later phase documents updated if needed
