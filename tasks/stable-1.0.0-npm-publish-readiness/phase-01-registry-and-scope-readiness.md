# Phase 01: Registry And Scope Readiness

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
> - Do not add fallback code just to make a check pass. Fix the earliest correct source of missing or invalid state.
> - Do not publish to npm while `npm whoami` fails or while `@batonkit` scope ownership is unconfirmed.

## Goal

Confirm the package scope, package names, npm login status, and registry availability before changing stable release metadata.

Plain language: before printing the final label, make sure the label name is available and the person holding the npm key can use it.

## Tasks

1. Confirm current branch and PR state.
2. Confirm npm login status:

```bash
npm whoami
```

3. Check public package availability:

```bash
npm view @batonkit/core name version --json
npm view @batonkit/postgres name version --json
npm view @batonkit/worker name version --json
npm view @batonkit/next name version --json
npm view @batonkit/provider-railway name version --json
npm view @batonkit/monitor-webhook name version --json
```

4. Record whether `@batonkit/worker` is confirmed as the public worker package name.
5. If npm auth is missing, record it as a publish execution blocker, not as a code blocker.
6. Review this phase and update `Phase Review`.
7. Commit this plan and registry readiness record.

## Acceptance Criteria

- `@batonkit/worker` is recorded as the confirmed worker package name.
- Registry lookup evidence is recorded.
- npm auth status is recorded.
- Any blocker is specific and actionable.
- The phase is reviewed, documented, and committed separately.

## Completion Notes

- Branch: `codex/productization-readiness`.
- Current PR: https://github.com/NimowaYangjowi/Batonkit/pull/1
- Confirmed worker package name: `@batonkit/worker`.
- `npm whoami` result: failed with `ENEEDAUTH`; this machine is not logged in to npm.
- Public registry lookup returned `E404` for:
  - `@batonkit/core`
  - `@batonkit/postgres`
  - `@batonkit/worker`
  - `@batonkit/next`
  - `@batonkit/provider-railway`
  - `@batonkit/monitor-webhook`
- Publish execution blocker: npm login and `@batonkit` scope permission still need to be confirmed before actual publish.

Plain language: the package names look open, but the npm account key is not present yet.

## Phase Review

- Status: complete for planning and registry discovery.
- Regression risk: none. This phase added only task documentation and performed registry/account checks.
- API clarity: improved. The stable worker package name is explicitly recorded as `@batonkit/worker`.
- Overengineering: avoided. This phase did not introduce automation before account permissions were known.
- Test gaps: not applicable; no runtime code changed.
- Docs gaps: stable publish blockers are now documented before metadata changes.
- Performance/cost impact: none.
- Security impact: positive. The plan blocks actual npm publish until auth and scope ownership are confirmed.
- Public-package ergonomics: improved because package naming and account requirements are explicit.
- Later phase update: Phase 05 must treat npm login and scope permission as a hard publish gate.

## Completion Checklist

- [x] Current branch recorded
- [x] `@batonkit/worker` confirmed as the worker package name
- [x] Public package lookup completed
- [x] npm auth status recorded
- [x] Publish blocker recorded if needed
- [x] Phase review completed
- [x] Phase document updated
- [x] Later phase documents updated if needed
- [x] Phase committed

