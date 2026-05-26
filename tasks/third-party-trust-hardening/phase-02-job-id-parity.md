# Phase 02: Job ID Parity

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

Make caller-provided job IDs behave consistently between the in-memory queue and the Postgres queue.

Plain language: the practice version and the real version should react the same way when a user tries to reuse the same job ticket number.

## User-Facing Risk

Today, the in-memory queue silently replaces an existing job when the same ID is reused, while the Postgres queue rejects that duplicate key. This makes local tests less trustworthy.

Plain language: in the toy box version, writing the same name tag twice secretly swaps the old toy. In the real warehouse, the clerk stops you and says that tag is already taken.

## Files

- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/src/index.test.ts`
- Possibly modify: `docs/queue-core.md`
- Possibly modify: `docs/api-reference.md`
- Possibly modify: `README.md`
- Update this phase document

## Implementation Tasks

1. Write a failing test proving the memory queue rejects duplicate caller-provided job IDs.
2. Decide whether the shared public contract should reject duplicates, upsert them, or expose a separate idempotent API.
3. Implement the selected behavior in the smallest way that matches current Postgres semantics.
4. Add docs that explain what caller-provided IDs are for and how duplicates behave.
5. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

6. Review this phase and update `Phase Review`.
7. Commit:

```bash
git add .
git commit -m "fix: align duplicate job id behavior"
```

## Acceptance Criteria

- The in-memory queue no longer silently overwrites an existing caller-provided job ID.
- The documented contract matches both queue implementations.
- Existing enqueue behavior stays unchanged for fresh IDs.
- The phase is committed independently.

## Phase Review

- Pending implementation.

## Completion Checklist

- [ ] Failing regression tests written first
- [ ] Memory and Postgres duplicate-ID behavior aligned
- [ ] Fresh enqueue behavior preserved
- [ ] Docs updated if public behavior changes
- [ ] Verification commands pass
- [ ] Phase review completed
- [ ] Phase committed
- [ ] Later phase documents updated if needed
