# Phase 02: Stable Version And Release Metadata

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

Change package metadata from `0.1.0-beta.0` to stable `1.0.0`, and update release docs so users see a stable first release rather than a beta candidate.

Plain language: this phase changes the version sticker from "test release" to "first official release".

## Tasks

1. Update root, package, example, and lockfile versions from `0.1.0-beta.0` to `1.0.0`.
2. Update internal `@batonkit/*` dependency pins to `1.0.0`.
3. Update `CHANGELOG.md` with a `1.0.0` stable release entry.
4. Update `README.md` maturity language from beta candidate to stable first release.
5. Update `docs/release.md` so stable publish requirements and npm dist-tag guidance are accurate.
6. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run test:pack
npm run lint
npm audit --omit=dev
```

7. Review this phase and update `Phase Review`.
8. Commit metadata changes separately.

## Acceptance Criteria

- All public package versions are `1.0.0`.
- Internal `@batonkit/*` dependencies are pinned to `1.0.0`.
- README, CHANGELOG, and release docs no longer describe this as beta.
- Package smoke test passes after version changes.
- The phase is reviewed, documented, and committed separately.

## Completion Notes

- Updated root, public package, example package, and lockfile versions to `1.0.0`.
- Updated internal `@batonkit/*` dependency pins to `1.0.0`.
- Updated README maturity language from beta candidate to stable `1.0.0` boundaries.
- Updated CHANGELOG with a `1.0.0` stable entry and kept the npm auth/scope blocker explicit.
- Updated `docs/release.md` to describe stable publish gates rather than beta-tagged publish gates.
- Verification commands:

```bash
npm run build          # passed
npm run typecheck      # passed
npm run test           # passed
npm run test:pack      # passed
npm run lint           # passed
npm audit --omit=dev   # passed: 0 vulnerabilities
```

## Phase Review

- Status: complete. Stable version and release metadata now use `1.0.0`.
- Regression risk: low. This phase changed package metadata and docs, not runtime behavior.
- API clarity: improved. `@batonkit/worker` is part of the stable public package set, and docs no longer describe the release as beta.
- Overengineering: avoided. No new automation or publish script was added before npm account permission is confirmed.
- Test gaps: addressed for metadata changes through build, typecheck, unit tests, pack smoke, lint, and audit.
- Docs gaps: partially addressed. Phase 03 still needs stable tutorial and operations runbooks before publish execution.
- Performance/cost impact: none.
- Security impact: neutral. The npm auth/scope blocker remains explicit.
- Public-package ergonomics: improved because package metadata now matches the requested stable release target.
- Later phase update: Phase 04 dry-runs must confirm all package tarballs report `1.0.0`.

## Completion Checklist

- [x] Package versions updated to `1.0.0`
- [x] Internal dependencies updated to `1.0.0`
- [x] Changelog updated
- [x] README maturity language updated
- [x] Release docs updated
- [x] Package smoke test passes
- [x] Phase review completed
- [x] Phase document updated
- [x] Later phase documents updated if needed
- [x] Phase committed
