# Release Process

This project is pre-release.

## Versioning

Use semantic versioning once public releases begin:

- patch: bug fixes and docs
- minor: new APIs that are backward compatible
- major: breaking API or schema changes

## Pre-Publish Checks

```bash
npm run build
npm run typecheck
npm run test
npm run lint
```

## Publishing

Packages should be published under the `@batonkit` scope.

Do not publish until:

- live Postgres integration tests exist
- public API names have been reviewed
- failover drill docs have been tested against a real backup provider

