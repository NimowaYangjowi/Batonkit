# Phase 03: Control-Plane Input Validation

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

Reject malformed control-plane requests with clear `400` responses before they hit deeper runtime or store code.

Plain language: the admin door should not just be locked; it should also tell you clearly when you are holding the wrong form.

## User-Facing Risk

Today, the route authenticates callers but trusts the JSON body too much. Bad shapes can lead to confusing runtime failures instead of a clear client error.

Plain language: the security guard checks your badge, but nobody checks whether your paper says "heartbeat" or random scribbles before handing it to the control room.

## Files

- Modify: `packages/next/src/index.ts`
- Modify: `packages/next/src/index.test.ts`
- Possibly modify: `docs/control-plane.md`
- Possibly modify: `docs/api-reference.md`
- Possibly modify: `packages/next/README.md`
- Update this phase document

## Implementation Tasks

1. Write failing tests for malformed JSON bodies and unsupported/missing fields on the control-plane route.
2. Decide the smallest useful validation boundary for heartbeat and ownership update requests.
3. Implement the validation and return stable `400` responses for client mistakes.
4. Keep auth behavior unchanged.
5. Update docs to describe the accepted control event shapes.
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
git commit -m "fix: validate control plane inputs"
```

## Acceptance Criteria

- Malformed request bodies fail with clear `400` responses.
- Well-formed heartbeat and ownership requests still succeed.
- Auth behavior remains unchanged.
- Docs describe the accepted request shapes.
- The phase is committed independently.

## Phase Review

- Pending implementation.

## Completion Checklist

- [ ] Failing regression tests written first
- [ ] Malformed control requests return clear 400 responses
- [ ] Valid requests still succeed
- [ ] Auth behavior preserved
- [ ] Docs updated if public behavior changes
- [ ] Verification commands pass
- [ ] Phase review completed
- [ ] Phase committed
- [ ] Later phase documents updated if needed
