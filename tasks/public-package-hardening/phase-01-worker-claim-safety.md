# Phase 01: Worker Claim Safety

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

Prevent a worker from claiming and failing jobs that it is not registered to handle.

Plain language: if one worker only knows how to make previews, it should not grab a billing report job and mark it failed just because it does not recognize it.

## User-Facing Risk

Today, a worker first asks for jobs it knows by name. If none are available, it asks for any job and fails unknown work. That can poison a shared queue when different worker processes handle different task types.

Plain language: this is like a cashier grabbing a kitchen order, saying "I do not cook this," and throwing the ticket away. The ticket should stay in the kitchen line instead.

## Files

- Modify: `packages/worker/src/index.ts`
- Modify: `packages/worker/src/index.test.ts`
- Possibly modify: `docs/worker-runtime.md`
- Possibly modify: `docs/api-reference.md`
- Update this phase document

## Implementation Tasks

1. Write a failing test where a worker with only `generate-preview` registered does not claim or fail a queued `send-report` job.
2. Decide whether unknown-job failure should be opt-in, a dedicated maintenance mode, or removed from normal worker polling.
3. Implement the selected behavior while keeping normal matching-job processing unchanged.
4. Add a regression test for an empty job registry so a worker with no handlers does not sweep unrelated work.
5. Update docs to explain that workers only process registered job names by default.
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
git commit -m "fix: prevent workers from claiming unknown jobs"
```

## Acceptance Criteria

- A worker does not claim jobs outside its registered job names during normal polling.
- Matching jobs still complete successfully.
- Handler failures still move through the existing retry and dead-letter policy.
- Docs explain how mixed job-type deployments should be structured.
- The phase is committed independently.

## Phase Review

- Pending. Complete after implementation.

## Completion Checklist

- [ ] Failing regression tests written first
- [ ] Normal worker polling ignores unregistered job names
- [ ] Existing matching-job behavior preserved
- [ ] Docs updated if public behavior changes
- [ ] Verification commands pass
- [ ] Phase review completed
- [ ] Phase committed
- [ ] Later phase documents updated if needed

