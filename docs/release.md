# Release Process

This project is a public beta candidate at `0.1.0-beta.0`.

Plain language: BatonKit is ready for beta reviewers to install and test, but it is not yet a promise that every production edge case is covered.

## Versioning

Use semantic versioning for public releases:

- patch: bug fixes and docs
- minor: new APIs that are backward compatible
- major: breaking API or schema changes

Use npm prerelease tags such as `0.1.0-beta.0` until the project is ready to remove beta warnings.

## Pre-Publish Checks

```bash
npm run build
npm run typecheck
npm run test
npm run test:postgres
npm run test:pack
npm run drill:failover
npm run drill:railway-live
npm run drill:railway-live:remote
npm run lint
npm audit --omit=dev
```

## Publishing

Packages should be published under the `@batonkit` scope.

Publish beta packages with an npm beta tag only after:

- live Postgres integration tests pass
- `npm pack` consumer smoke tests pass
- failover drill passes
- public API names have been reviewed
- failover drill docs have been tested against a real backup provider
- `docs/railway-live-drill.md` has a completed real Railway proof run, not only local harness output
- README includes the required production wiring for migrations, worker heartbeats, monitor webhooks, and failback reconciliation
- control-plane route security defaults have been reviewed for the release target

Do not publish stable packages until:

- at least one real adopter has run BatonKit with its own monitor and Postgres environment
- operational runbooks cover failed migrations, stuck leases, degraded workers, and provider outages
- package names and scope are confirmed
- README has a copy-pasteable tutorial for a fresh Next.js + Postgres app
- beta feedback has not found public API naming or data-model blockers

Plain language: beta can go to careful testers. Stable should wait until the package has been tried in a real small app and the rescue instructions are written down.
