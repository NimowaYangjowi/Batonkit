# Phase 01: Worker Runtime Resilience

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

Prevent a worker from looking healthy while its main polling loop has already stopped making progress.

Plain language: the background helper should not show a green status light if its motor already stalled.

## User-Facing Risk

Today, a storage error or unexpected runtime error can bubble out of the worker loop and end the processing promise. Heartbeats can still keep reporting `ok`, which creates a false sense of safety during an outage.

Plain language: this is like a delivery truck that keeps sending "I am here" pings from the parking lot even though the engine died and packages are no longer moving.

## Files

- Modify: `packages/worker/src/index.ts`
- Modify: `packages/worker/src/index.test.ts`
- Possibly modify: `docs/worker-runtime.md`
- Possibly modify: `docs/api-reference.md`
- Possibly modify: `packages/worker/README.md`
- Update this phase document

## Implementation Tasks

1. Write a failing regression test where `claimNext(...)` or the polling loop throws once and the worker reports degraded health instead of silently staying `ok`.
2. Decide whether the worker should stop, retry, or mark a durable degraded status after loop errors.
3. Implement the smallest behavior that prevents false healthy signaling and preserves explicit error logging.
4. Add a regression test proving shutdown still completes cleanly after the new error path.
5. Update docs to explain what the worker health light means after runtime errors.
6. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

7. Review this phase and update `Phase Review`.
8. Commit:

```bash
git add .
git commit -m "fix: surface worker runtime degradation"
```

## Acceptance Criteria

- A worker does not continue reporting plain `ok` after its polling loop hits an unhandled runtime/store error.
- The worker logs the failure clearly.
- Stopping the worker still works after the new degraded path.
- Docs explain the new health behavior.
- The phase is committed independently.

## Phase Review

- Regression risk: low to medium. The worker now treats a fatal polling-loop failure as a degraded runtime state, which changes liveness signaling but does not change the claim/complete/fail path for healthy jobs.
- API clarity: improved. The health model now better matches what operators see in the control-plane state: `ok` while the loop is healthy, `degraded` after a fatal runtime/store failure, then `stopping` on shutdown.
- Overengineering: avoided. This phase does not add restart orchestration, supervisors, or persistent crash recovery; it only prevents false healthy signaling and preserves clear logging.
- Test gaps: acceptable for this phase. New tests cover degraded heartbeat reporting and clean shutdown after loop failure, while existing tests still cover normal processing, handler failures, stop behavior, and concurrency.
- Docs gaps: addressed in `docs/worker-runtime.md`, `docs/api-reference.md`, and `packages/worker/README.md`.
- Performance/cost impact: negligible. The extra work only occurs on fatal loop errors and during the next heartbeat refresh.
- Security impact: neutral. No new endpoint or data exposure was added.
- Public-package ergonomics: improved because adopters can trust the shared worker status light more during incidents.
- Later phase update: not required. The remaining phases still match the current architecture and priorities.

## Completion Checklist

- [x] Failing regression tests written first
- [x] Worker loop no longer looks healthy after fatal polling errors
- [x] Error logging remains clear
- [x] Shutdown path still works
- [x] Docs updated if public behavior changes
- [x] Verification commands pass
- [x] Phase review completed
- [ ] Phase committed
- [x] Later phase documents updated if needed
