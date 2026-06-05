# Phase 02: Automatic Failback

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
> - Use TDD for behavior changes: write the failing test, watch it fail, implement the smallest passing code, then refactor.

## Goal

Make failback behavior match the public promise: after local recovery and cooldown, ownership returns to local without requiring an accidental second monitor event.

## User-Facing Risk

Current behavior starts a cooldown on an `up` event, but restoration only happens if another `up` event arrives after the cooldown. Many monitoring tools send one recovery webhook. In that case, backup ownership may stay active longer than intended.

## Files

- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/failover.test.ts`
- Possibly modify: `packages/next/src/index.ts`
- Possibly modify: `packages/next/src/index.test.ts`
- Modify: `docs/failover.md`
- Update this phase document

## Design Options To Decide During Implementation

- Add a public `reconcileFailback(...)` helper that can be called by a cron, route, or worker heartbeat loop.
- Make `applyFailoverEvent({ event: 'up' })` optionally wait for cooldown before returning when a caller explicitly asks for that behavior.
- Add a route-helper action that checks whether `failbackNotBefore` has passed and restores ownership.

Recommended starting point: add an explicit reconciliation helper. It is easy to test, does not block request handlers, and makes the user's responsibility clear.

## Implementation Tasks

1. Write failing tests proving that a single recovery event plus a later reconciliation restores local ownership.
2. Implement the reconciliation helper or selected equivalent.
3. Ensure `provider.park()` is called when ownership returns to local.
4. Add tests for no-op behavior before the cooldown expires.
5. Add tests for maintenance override so manual operator control is respected.
6. Update failover docs with the exact operational loop users must run.
7. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run drill:failover
npm run lint
npm audit --omit=dev
```

8. Review this phase and update `Phase Review`.
9. Commit:

```bash
git add .
git commit -m "feat: add failback reconciliation"
```

## Acceptance Criteria

- One `up` event can start cooldown and a later reconciliation can restore local ownership.
- No restoration happens before `failbackNotBefore`.
- Maintenance override remains a no-op for automated failover and failback.
- Provider parking still happens exactly when backup should stop being active.
- Docs tell users where reconciliation should run.
- The phase is committed independently.

## Phase Review

- Regression risk: low to medium. The phase adds a new reconciliation helper without changing existing `applyFailoverEvent(...)` behavior, so existing monitor webhook flows keep working.
- API clarity: improved. `applyFailoverEvent(...)` now owns monitor events, while `reconcileFailback(...)` owns the scheduled "is cooldown done yet?" check.
- Overengineering: avoided. The implementation adds one small helper instead of a scheduler, route framework, or blocking request behavior.
- Test gaps: acceptable for this phase. Tests cover restoration after cooldown, no-op before cooldown, provider parking, and maintenance override.
- Docs gaps: addressed in `docs/failover.md` and `docs/api-reference.md`.
- Performance/cost impact: neutral. Reconciliation only reads control state and updates ownership when cooldown has elapsed; callers choose their own schedule.
- Security impact: neutral. No new HTTP route or secret surface was introduced.
- Public-package ergonomics: improved because users can rely on one monitor recovery event plus a periodic reconciliation loop.
- Later phase update: not required. Phase 03 can still add worker heartbeat support independently.

## Completion Checklist

- [x] Failing reconciliation tests written first
- [x] Failback reconciliation implemented
- [x] Provider parking covered by tests
- [x] Maintenance override behavior preserved
- [x] Failover docs updated
- [x] Verification commands pass
- [x] Phase review completed
- [x] Phase committed
- [x] Later phase documents updated if needed
