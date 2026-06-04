# Phase 05: NPM Publish Execution Gate

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

Define the actual stable npm publish gate and record whether the release can be published now or remains blocked by account permission.

Plain language: this is the final stop sign. If the npm key works and every check passed, publish can happen. If the key is missing, stop cleanly.

## Tasks

1. Confirm npm login:

```bash
npm whoami
```

2. Confirm `@batonkit` scope permission using npm account/team checks available to the logged-in account.
3. Confirm package names still return `E404` or otherwise do not conflict with an existing package owned by someone else.
4. Only after Phases 01-04 are complete and auth is confirmed, publish in dependency order:

```bash
cd packages/core && npm publish --access public
cd ../postgres && npm publish --access public
cd ../worker && npm publish --access public
cd ../next && npm publish --access public
cd ../provider-railway && npm publish --access public
cd ../monitor-webhook && npm publish --access public
```

5. Verify registry publication:

```bash
npm view @batonkit/worker version
```

6. Record publish result, blockers, package versions, and any npm URLs.
7. Commit final publish decision docs.
8. Push the branch and update the PR.

## Acceptance Criteria

- The release is either published as stable `1.0.0` or explicitly blocked by npm auth/scope permission.
- If published, every package is registered under `@batonkit` with version `1.0.0`.
- If blocked, the blocker is actionable and no partial publish occurred.
- The final decision is documented and committed.

## Completion Notes

- `npm whoami` failed with `ENEEDAUTH`, so actual npm publish was not attempted.
- `@batonkit/worker` remains confirmed as the public worker package name.
- Rechecked public registry names; all returned `E404`:
  - `@batonkit/core`
  - `@batonkit/postgres`
  - `@batonkit/worker`
  - `@batonkit/next`
  - `@batonkit/provider-railway`
  - `@batonkit/monitor-webhook`
- No partial publish occurred.
- Actionable blocker: run `npm adduser` or otherwise authenticate npm on this machine, then confirm the logged-in account can publish under the `@batonkit` scope.
- After auth is confirmed, publish in dependency order:
  1. `@batonkit/core`
  2. `@batonkit/postgres`
  3. `@batonkit/worker`
  4. `@batonkit/next`
  5. `@batonkit/provider-railway`
  6. `@batonkit/monitor-webhook`

Plain language: nothing was uploaded yet. The next person only needs to unlock npm, then press the publish steps in order.

## Phase Review

- Status: blocked for actual npm registration, complete for publish preparation.
- Regression risk: none. This phase changed documentation only and did not publish packages.
- API clarity: unchanged. `@batonkit/worker` remains the confirmed worker package name.
- Overengineering: avoided. The plan did not add publish automation while account permission is unknown.
- Test gaps: no publish-preparation gap remains; Phase 04 passed full release gates and dry-runs.
- Docs gaps: no blocking docs gap remains. The final blocker is account-level, not code or documentation.
- Performance/cost impact: none.
- Security impact: positive. The gate prevented unauthenticated or partial publish.
- Public-package ergonomics: ready. Packages are `1.0.0`, dry-run clean, and documented.
- Later phase update: none. The remaining action is outside repo code: npm authentication and scope permission.

## Completion Checklist

- [ ] npm login confirmed
- [ ] `@batonkit` scope permission confirmed
- [x] Package names rechecked
- [x] Stable publish completed or blocker recorded
- [ ] Registry result verified if published
- [x] Phase review completed
- [x] Phase document updated
- [x] Phase committed
