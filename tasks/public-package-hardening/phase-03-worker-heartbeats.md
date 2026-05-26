# Phase 03: Worker Heartbeats

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

Add first-class heartbeat support to the worker runtime or correct the docs if the runtime should remain store-only.

Plain language: if the docs say the worker reports "I am alive," the package should either do that for users or clearly show the small piece users must wire themselves.

## User-Facing Risk

The worker README currently promises support for heartbeats, but `createWorker(...)` only accepts a job store, worker ID, job list, concurrency, leases, polling, and logger. A third-party user can reasonably expect status reporting to work out of the box and then discover the missing connection during deployment.

Plain language: the manual says the machine has a dashboard light, but the installed machine has no wire to that light yet.

## Files

- Modify: `packages/worker/src/index.ts`
- Modify: `packages/worker/src/index.test.ts`
- Possibly modify: `packages/core/src/index.ts`
- Modify: `packages/worker/README.md`
- Modify: `docs/worker-runtime.md`
- Modify: `docs/control-plane.md`
- Update this phase document

## Design Options To Decide During Implementation

- Add optional `control`, `platform`, and `heartbeatIntervalMs` fields to `createWorker(...)`.
- Add a separate `createHeartbeatLoop(...)` helper so queue processing stays separate from control-plane reporting.
- Remove heartbeat claims from worker docs and keep heartbeat wiring only in examples.

Recommended starting point: add optional runtime heartbeat support. It matches the public expectation and keeps the default simple for tests and demos.

## Implementation Tasks

1. Write a failing test that a worker with heartbeat options records a heartbeat on `start()`.
2. Write a failing test that the heartbeat loop stops on `stop()`.
3. Implement optional heartbeat configuration without requiring all workers to use a control store.
4. Ensure heartbeat failures are logged but do not silently break job processing unless the selected design explicitly treats them as fatal.
5. Update docs and examples with local and backup worker heartbeat setup.
6. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

7. If Postgres heartbeat behavior changes, also run:

```bash
npm run test:postgres
```

8. Review this phase and update `Phase Review`.
9. Commit:

```bash
git add .
git commit -m "feat: add worker heartbeat support"
```

## Acceptance Criteria

- Worker heartbeat behavior is either implemented or the public docs no longer promise it.
- If implemented, heartbeat setup is optional and backward compatible.
- Heartbeats include platform, worker ID, health status, and observed time.
- Heartbeat timers stop cleanly when the worker stops.
- Docs show how users see local and backup worker status.
- The phase is committed independently.

## Phase Review

- Regression risk: medium. Worker startup and shutdown now have optional heartbeat side effects, but the behavior is disabled unless both `control` and `platform` are provided.
- API clarity: improved. Heartbeat setup is part of `createWorker(...)` options and requires the same worker-facing concepts users already see: control store, platform, worker ID, and interval.
- Overengineering: avoided. The worker runtime uses the existing `ControlStore.recordHeartbeat(...)` contract instead of adding a separate heartbeat service.
- Test gaps: acceptable for this phase. Tests cover heartbeat on start, timer cleanup on stop, and heartbeat failure logging without blocking startup.
- Docs gaps: addressed in `docs/worker-runtime.md`, `docs/api-reference.md`, and `packages/worker/README.md`.
- Performance/cost impact: low and configurable. Heartbeats are optional and default to a 30 second interval when enabled.
- Security impact: neutral. No new route or secret surface was added; workers write through the existing control store.
- Public-package ergonomics: improved because the worker package now matches its heartbeat documentation.
- Later phase update: not required. Phase 04 can still handle API parity and control read security independently.

## Completion Checklist

- [x] Failing heartbeat tests written first
- [x] Heartbeat behavior implemented or docs corrected
- [x] Timer shutdown covered by tests
- [x] Docs updated
- [x] Verification commands pass
- [x] Phase review completed
- [x] Phase committed
- [x] Later phase documents updated if needed
