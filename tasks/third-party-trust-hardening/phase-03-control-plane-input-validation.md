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

- Regression risk: low to medium. The route now rejects malformed control requests earlier, which changes some failure responses from generic runtime errors to explicit `400` client errors while preserving successful valid requests.
- API clarity: improved. The accepted heartbeat and ownership request shapes are now documented and enforced together.
- Overengineering: avoided. This phase uses small inline validators rather than adding a schema dependency or a broad serialization layer.
- Test gaps: acceptable for this phase. New tests cover malformed JSON, invalid heartbeat bodies, invalid ownership bodies, and a valid heartbeat success path, while existing tests still cover auth and read behavior.
- Docs gaps: addressed in `docs/control-plane.md`, `docs/api-reference.md`, and `packages/next/README.md`.
- Performance/cost impact: negligible. Validation is a few field checks before calling the control store.
- Security impact: positive. The control route now fails closed on malformed bodies and gives clearer client-facing errors without forwarding bad payloads deeper into the system.
- Public-package ergonomics: improved because adopters now get clearer feedback when wiring monitors, workers, or operator scripts to the control route.
- Later phase update: phase 04 should focus on a final audit and release-note pass rather than discovering new behavior changes, because the main user-facing docs were already updated during phases 1 through 3.

## Completion Checklist

- [x] Failing regression tests written first
- [x] Malformed control requests return clear 400 responses
- [x] Valid requests still succeed
- [x] Auth behavior preserved
- [x] Docs updated if public behavior changes
- [x] Verification commands pass
- [x] Phase review completed
- [x] Phase committed
- [x] Later phase documents updated if needed
