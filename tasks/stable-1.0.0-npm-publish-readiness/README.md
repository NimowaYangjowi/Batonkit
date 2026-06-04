# BatonKit Stable 1.0.0 NPM Publish Readiness Plan

> **For implementers:** Read this folder before writing code. Each phase document begins with the same operating rules. Follow those rules literally: complete one phase, commit it, review it, update the completed phase notes, then update future phase plans if implementation changed the design.

## Goal

Move BatonKit from `0.1.0-beta.0` public beta candidate language to a stable `1.0.0` npm publish-ready release under the confirmed `@batonkit` scope, with `@batonkit/worker` as the confirmed worker package name.

Plain language: this plan changes the box label from "test version" to "real first release", then checks that the box can actually be put on npm safely.

## Confirmed Direction

- Stable version target: `1.0.0`
- Confirmed worker package name: `@batonkit/worker`
- Publish scope: `@batonkit`
- Publish mode: stable npm publish, not beta-tagged prerelease
- No npm publish should happen until npm login and scope ownership are confirmed.

## Current Known State

- Branch: `codex/productization-readiness`
- Existing PR: https://github.com/NimowaYangjowi/Batonkit/pull/1
- Current package version: `0.1.0-beta.0`
- `npm whoami` currently fails with `ENEEDAUTH`, so this machine is not logged in to npm.
- Registry lookup returned `E404` for the public package names checked:
  - `@batonkit/core`
  - `@batonkit/postgres`
  - `@batonkit/worker`
  - `@batonkit/next`
  - `@batonkit/provider-railway`
  - `@batonkit/monitor-webhook`

Plain language: the names look unused from public lookup, but the account key for publishing is not installed on this machine yet.

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

Plain language: before calling this stable, prove the package builds, installs, runs the database path, hands work to the backup worker, and has no known production dependency vulnerabilities.

## Non-Goals

- Do not publish to npm while `npm whoami` fails.
- Do not publish unless the npm account has permission for the `@batonkit` scope.
- Do not use beta prerelease tags for the stable `1.0.0` release.
- Do not change public package names away from `@batonkit/*` in this plan.
- Do not add app-specific job names, table names, UI concepts, or secrets to public packages.
- Do not add database triggers or hidden database-side automation.
- Do not add fallback code to hide missing secrets, missing state, invalid schemas, or failed provider calls.

