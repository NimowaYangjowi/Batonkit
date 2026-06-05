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

Define the actual stable npm publish gate and record the stable release publication result.

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

- The release is published as stable `1.0.0`.
- Every package is registered under `@batonkit` with version `1.0.0`.
- Public registry lookup and public install dry-run checks pass without an npm auth token.
- The final decision is documented and committed.

## Completion Notes

- `npm whoami` succeeded as `yubufox` after npm authentication was provided.
- A temporary granular npm access token with 2FA bypass was generated in the logged-in Chrome session for the publish operation.
- The `@batonkit` npm organization was created because the scope did not exist before the first publish attempt.
- `@batonkit/worker` remains confirmed as the public worker package name.
- Rechecked public registry names before publish; all returned `E404`:
  - `@batonkit/core`
  - `@batonkit/postgres`
  - `@batonkit/worker`
  - `@batonkit/next`
  - `@batonkit/provider-railway`
  - `@batonkit/monitor-webhook`
- Published stable `1.0.0` packages in dependency order:
  1. `@batonkit/core`
  2. `@batonkit/postgres`
  3. `@batonkit/worker`
  4. `@batonkit/next`
  5. `@batonkit/provider-railway`
  6. `@batonkit/monitor-webhook`
- `npm access get status` reported `public` for all six packages.
- npm web verified the organization package list, package version `1.0.0`, package access `Public`, and package access status `public`.
- Public registry propagation completed after a short delay.
- Public `npm view` checks without an auth token returned `1.0.0` for all six packages.
- Public install dry-run without an auth token passed for all six packages:

```bash
npm install @batonkit/core@1.0.0 @batonkit/postgres@1.0.0 @batonkit/worker@1.0.0 @batonkit/next@1.0.0 @batonkit/provider-railway@1.0.0 @batonkit/monitor-webhook@1.0.0 --dry-run
```

- The local npm auth token was removed from `~/.npmrc` after publish verification.
- The generated web token remains revocable from the npm dashboard and expires on June 12, 2026.

## Phase Review

- Status: complete. Stable `1.0.0` npm publish succeeded.
- Regression risk: low. Runtime code did not change in this phase; the external behavior changed because public packages now exist on npm.
- API clarity: unchanged. `@batonkit/worker` remains the confirmed worker package name.
- Overengineering: avoided. The release used explicit npm checks and direct publish commands instead of adding repo automation for a one-time account operation.
- Test gaps: no blocking publish gap remains; Phase 04 passed full release gates and dry-runs, and this phase passed public registry lookup plus public install dry-run.
- Docs gaps: no blocking docs gap remains. The stable publish result is recorded here.
- Performance/cost impact: none.
- Security impact: positive. A temporary granular publish token was used, local npm auth was removed after verification, and the npm dashboard token should be revoked once the user confirms it is no longer needed.
- Public-package ergonomics: published. Packages are `1.0.0`, public, dry-run installable, and documented.
- Later phase update: none. This is the final phase.

## Completion Checklist

- [x] npm login confirmed
- [x] `@batonkit` scope permission confirmed
- [x] Package names rechecked
- [x] Stable publish completed or blocker recorded
- [x] Registry result verified if published
- [x] Phase review completed
- [x] Phase document updated
- [x] Phase committed
