# Phase 01: Postgres Control Store

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

Implement a real Postgres-backed `ControlStore` so ownership and heartbeat state are durable.

Plain language: the baton holder must be written in the shared database, not just memory, so local and Railway workers agree on who may work.

## Files

- Modify: `packages/postgres/src/index.ts`
- Modify: `packages/postgres/src/index.test.ts`
- Create or modify: `packages/postgres/src/integration.test.ts`
- Update: `docs/control-plane.md`
- Update: `docs/api-reference.md`
- Update this phase document

## Tasks

1. Write a failing unit test for `postgresControlStore(...)` exposing:
   - `getState()`
   - `updateOwnership(...)`
   - `recordHeartbeat(...)`
   - `allowClaims(platform)`
2. Implement the minimal query-client backed `postgresControlStore`.
3. Extend the real Postgres integration test to:
   - run `createControlPlaneMigrationSql()`
   - assert default local ownership
   - record local heartbeat
   - switch ownership to backup
   - assert backup claims are allowed and local claims are blocked
4. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run test:postgres
npm run lint
npm audit --omit=dev
```

5. Update docs for the new Postgres control store.
6. Review this phase and update `Phase Review`.
7. Commit:

```bash
git add .
git commit -m "feat: add postgres control store"
```

## Acceptance Criteria

- `postgresControlStore` implements the same `ControlStore` contract as `createMemoryControlStore`.
- Real Postgres integration verifies durable ownership and heartbeat behavior.
- No Railway-specific code appears in the Postgres store.
- Docs explain when to use memory vs Postgres control stores.

## Phase Review

To be completed after implementation.

## Completion Checklist

- [ ] Failing tests written first
- [ ] `postgresControlStore` implemented
- [ ] Real Postgres integration coverage added
- [ ] Docs updated
- [ ] Verification commands pass
- [ ] Phase review completed
- [ ] Phase committed
- [ ] Later phase documents updated if needed

