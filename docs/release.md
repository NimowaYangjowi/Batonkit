# Release Process

This project is being prepared for stable `1.0.0` publication.

## Versioning

Use semantic versioning for public releases:

- patch: bug fixes and docs
- minor: new APIs that are backward compatible
- major: breaking API or schema changes

Use stable versions such as `1.0.0` for npm `latest` publication. Use prerelease tags only for future preview work.

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

Publish stable packages with the default npm tag only after:

- live Postgres integration tests pass
- `npm pack` consumer smoke tests pass
- failover drill passes
- public API names have been reviewed and `@batonkit/worker` is confirmed
- failover drill docs have been tested against a real backup provider
- `docs/railway-live-drill.md` has a completed real Railway proof run, not only local harness output
- README includes the required production wiring for migrations, worker heartbeats, monitor webhooks, and failback reconciliation
- control-plane route security defaults have been reviewed for the release target
- package names and scope are confirmed
- npm login and `@batonkit` scope permission are confirmed
- publish dry-run passes for every public package
- `docs/stable-next-postgres-tutorial.md` includes a copy-pasteable tutorial for a fresh Next.js + Postgres app
- `docs/operations-runbook.md` covers failed migrations, stuck leases, degraded workers, provider outages, and failback reconciliation
