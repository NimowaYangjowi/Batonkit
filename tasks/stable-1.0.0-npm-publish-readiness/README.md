# BatonKit Stable 1.0.0 NPM Publish Readiness Plan

> **For implementers:** Read this folder before writing code. Each phase document begins with the same operating rules. Follow those rules literally: complete one phase, commit it, review it, update the completed phase notes, then update future phase plans if implementation changed the design.

## Goal

Move BatonKit from `0.1.0-beta.0` public beta candidate language to a stable `1.0.0` npm publish-ready release under the confirmed `@batonkit` scope, with `@batonkit/worker` as the confirmed worker package name.

## Confirmed Direction

- Stable version target: `1.0.0`
- Confirmed worker package name: `@batonkit/worker`
- Publish scope: `@batonkit`
- Publish mode: stable npm publish, not beta-tagged prerelease
- npm publish happened only after npm login and scope ownership were confirmed.

## Initial Known State

- Branch: `codex/productization-readiness`
- Existing PR: https://github.com/NimowaYangjowi/Batonkit/pull/1
- Initial package version before Phase 02: `0.1.0-beta.0`
- `npm whoami` initially failed with `ENEEDAUTH`; npm authentication was later provided through the logged-in browser session.
- Registry lookup returned `E404` for the public package names checked before publish:
  - `@batonkit/core`
  - `@batonkit/postgres`
  - `@batonkit/worker`
  - `@batonkit/next`
  - `@batonkit/provider-railway`
  - `@batonkit/monitor-webhook`
- The `@batonkit` npm organization was created during Phase 05 because the scope did not exist before publish.

## Progress

- Phase 01 complete: registry lookup and npm auth blocker recorded.
- Phase 02 complete: package metadata and release docs moved to stable `1.0.0`.
- Phase 03 complete: stable tutorial and operations runbook added.
- Phase 04 complete: full release gate and npm publish dry-run passed for all public packages.
- Phase 05 complete: stable `1.0.0` packages were published to npm and public install dry-run verification passed.

## Final Status

Stable `1.0.0` publication is complete. The following public npm packages are registered and installable:

- `@batonkit/core@1.0.0`
- `@batonkit/postgres@1.0.0`
- `@batonkit/worker@1.0.0`
- `@batonkit/next@1.0.0`
- `@batonkit/provider-railway@1.0.0`
- `@batonkit/monitor-webhook@1.0.0`

Public verification passed without a local npm auth token:

```bash
npm view @batonkit/core version
npm view @batonkit/postgres version
npm view @batonkit/worker version
npm view @batonkit/next version
npm view @batonkit/provider-railway version
npm view @batonkit/monitor-webhook version
npm install @batonkit/core@1.0.0 @batonkit/postgres@1.0.0 @batonkit/worker@1.0.0 @batonkit/next@1.0.0 @batonkit/provider-railway@1.0.0 @batonkit/monitor-webhook@1.0.0 --dry-run
```

## Phase Index

1. `phase-01-registry-and-scope-readiness.md`
2. `phase-02-stable-version-and-release-metadata.md`
3. `phase-03-stable-docs-and-operations-runbooks.md`
4. `phase-04-final-verification-and-publish-dry-run.md`
5. `phase-05-npm-publish-execution-gate.md`

## Cross-Phase Verification

Run the baseline checks before considering any implementation phase complete:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

Add targeted checks when the phase touches those surfaces:

- Postgres behavior: `npm run test:postgres`
- Package export, versioning, or installability behavior: `npm run test:pack`
- Failover behavior: `npm run drill:failover`
- Railway live drill harness behavior: `npm run drill:railway-live`
- Railway remote live drill behavior: `npm run drill:railway-live:remote`
- Publish artifacts: `npm publish --dry-run --access public` from each package directory

## Non-Goals

- Do not republish the same version; npm versions are immutable after publication.
- Do not publish future versions while `npm whoami` fails.
- Do not publish future packages unless the npm account has permission for the `@batonkit` scope.
- Do not use beta prerelease tags for the stable `1.0.0` release.
- Do not change public package names away from `@batonkit/*` in this plan.
- Do not add app-specific job names, table names, UI concepts, or secrets to public packages.
- Do not add database triggers or hidden database-side automation.
- Do not add fallback code to hide missing secrets, missing state, invalid schemas, or failed provider calls.
