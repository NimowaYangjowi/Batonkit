# Phase 02: Live Drill Harness

> **Phase Operating Rules**
>
> - Keep this phase independently shippable and commit it when complete.
> - At phase end, run a review focused on regression risk, API clarity, overengineering, test gaps, docs gaps, performance/cost impact, secret safety, and public-package ergonomics.
> - Record review findings in this phase document under `Phase Review`.
> - Update the completion checklist in this phase document before moving on.
> - If implementation changes the architecture, update all later phase documents before starting the next phase.
> - Do not carry any product-specific names, database tables, job types, deployment secrets, or UI concepts into the public API.
> - Keep Railway as one provider adapter; do not make Railway required by core.
> - Use TDD for behavior changes: write the failing test, watch it fail, implement the smallest passing code, then refactor.

## Goal

Create a reusable live drill harness that can run a harmless BatonKit worker against a real Postgres URL.

Plain language: make a small test app whose only job is to prove the baton can move safely.

## Files

- Create: `examples/railway-live-drill/package.json`
- Create: `examples/railway-live-drill/src/server.ts`
- Create: `examples/railway-live-drill/src/worker.ts`
- Create: `examples/railway-live-drill/src/drill.ts`
- Create: `examples/railway-live-drill/README.md`
- Add scripts to root `package.json` if useful
- Update this phase document

## Required Harness Behavior

- Expose `GET /ready`.
- Expose `POST /control-plane/refresh`.
- Use `BATONKIT_DATABASE_URL`.
- Use `BATONKIT_CONTROL_SECRET`.
- Register a harmless `generate-preview` job.
- Provide a command to enqueue one test job.
- Provide a command to run as `local`.
- Provide a command to run as `backup`.

## Tasks

1. Write failing tests or smoke checks for required env validation.
2. Implement env parsing with explicit errors for missing secrets.
3. Implement `/ready` and `/control-plane/refresh`.
4. Implement worker runtime entrypoint for `local` and `backup` platform modes.
5. Implement a `drill` command that:
   - migrates schema
   - enqueues a harmless job
   - confirms local can process it
   - switches ownership to backup
   - confirms backup can process a second job
6. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

7. Update docs and review notes.
8. Commit:

```bash
git add .
git commit -m "feat: add railway live drill harness"
```

## Acceptance Criteria

- The harness can run locally against `npm run test:postgres` style Postgres.
- Missing env vars fail clearly.
- The harness uses generic job names only.
- The harness does not require Railway-specific APIs except when configured with the Railway provider.

## Phase Review

To be completed after implementation.

## Completion Checklist

- [ ] Failing tests or smoke checks written first
- [ ] Harness server added
- [ ] Harness worker added
- [ ] Harness drill command added
- [ ] Verification commands pass
- [ ] Phase review completed
- [ ] Phase committed
- [ ] Later phase documents updated if needed

