# Phase 04: API Parity And Control Security

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

Make public APIs behave consistently across stores and tighten control-plane state exposure.

Plain language: the toy version and the real database version should not surprise users by behaving differently, and the status door should not show operational details to everyone by default.

## User-Facing Risks

- Caller-provided job IDs work in the memory store but are ignored by the Postgres store.
- `GET` control-plane state is public even though docs describe the route as a secure control door.

Plain language: a user might test duplicate-safe job IDs locally and then lose that behavior in production. Separately, the status endpoint may reveal which worker owns the baton and which worker IDs are active.

## Files

- Modify: `packages/postgres/src/index.ts`
- Modify: `packages/postgres/src/index.test.ts`
- Modify: `packages/postgres/src/integration.test.ts`
- Modify: `packages/next/src/index.ts`
- Modify: `packages/next/src/index.test.ts`
- Modify: `docs/api-reference.md`
- Modify: `docs/control-plane.md`
- Update this phase document

## Design Decisions To Make Before Code

- Decide whether `EnqueueOptions.id` is part of the stable public API or should be removed from docs and treated as store-internal.
- Decide whether control-plane `GET` should require the same bearer secret by default, or whether the route helper should support an explicit `publicRead: true` option.

Recommended starting point:

- Preserve `EnqueueOptions.id` and implement it in Postgres because it is already exported.
- Require authentication for `GET` by default, with an explicit opt-in for public read if needed.

## Implementation Tasks

1. Write a failing Postgres unit test showing `enqueue(..., { id })` sends the ID to SQL.
2. Write or extend integration coverage so caller-provided IDs round-trip through real Postgres.
3. Implement Postgres ID parity or explicitly remove the option from public docs and types.
4. Write failing route tests for unauthenticated `GET`.
5. Implement authenticated read behavior or explicit public-read opt-in.
6. Update docs with the exact route security model.
7. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run test:postgres
npm run test:pack
npm run lint
npm audit --omit=dev
```

8. Review this phase and update `Phase Review`.
9. Commit:

```bash
git add .
git commit -m "fix: align postgres enqueue ids and secure control reads"
```

## Acceptance Criteria

- Memory and Postgres stores agree on caller-provided job ID behavior.
- Package smoke tests still pass with updated exports and types.
- Control-plane read behavior is secure by default or explicitly documented as public.
- Tests cover unauthorized and authorized control-plane reads.
- Docs describe what information is exposed and how to protect it.
- The phase is committed independently.

## Phase Review

- Regression risk: medium. This changes two public surfaces: Postgres enqueue now preserves caller-provided IDs, and control-plane `GET` now requires authorization unless `publicRead` is explicitly enabled.
- API clarity: improved. `EnqueueOptions.id` is now consistently honored by memory and Postgres stores, and route read security has an explicit `publicRead` opt-in.
- Overengineering: avoided. The Postgres store uses the existing job ID column and the Next helper uses the existing bearer-secret check.
- Test gaps: acceptable for this phase. Unit tests cover query-client ID forwarding, unauthorized reads, authorized reads, and explicit public reads. Real Postgres integration covers custom ID round-trip.
- Docs gaps: addressed in `docs/api-reference.md`, `packages/next/README.md`, and `packages/postgres/README.md`.
- Performance/cost impact: neutral. The enqueue query shape changes by one optional value and control reads add one header check.
- Security impact: improved. Operational control-plane state is no longer public by default.
- Public-package ergonomics: improved because local test behavior now matches Postgres behavior for custom IDs.
- Later phase update: not required. Phase 05 can still do the broader docs release-readiness pass.

## Completion Checklist

- [x] Failing API parity tests written first
- [x] Postgres enqueue ID behavior aligned or public option removed
- [x] Control-plane read security clarified and tested
- [x] Docs updated
- [x] Verification commands pass
- [x] Phase review completed
- [x] Phase committed
- [x] Later phase documents updated if needed
