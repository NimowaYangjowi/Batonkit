# Phase 04: Release Metadata And Beta Docs

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
> - When using `/ship`, do not run the full workflow from `main`; switch to a `codex/` feature branch first.

## Goal

Update release metadata and public documentation so the package can be reviewed as a public beta candidate without pretending to be production-stable.

## User-Facing Risk

Current package versions are `0.0.0`, and docs still say pre-release. That is honest, but it is not yet a clear beta candidate. A public beta needs versioning, changelog context, and a crisp "what is ready versus what still requires operator setup" statement.

## Files

- Modify package `package.json` files if versioning moves from `0.0.0`
- Modify `VERSION` and `CHANGELOG.md` if those files are introduced or already exist
- Modify: `README.md`
- Modify: `docs/release.md`
- Modify: `docs/api-reference.md` if public API wording changes
- Modify package READMEs as needed
- Update this phase document

## Tasks

1. Decide the release label:

- `0.1.0-beta.0` style package version if npm prerelease tags are preferred
- `0.1.0` only if the project is ready to treat the API as public beta without prerelease semver

2. Make versioning consistent across all public packages.
3. Add or update changelog/release notes with:

- control-plane read security
- worker heartbeat/degraded behavior
- duplicate job ID parity between memory and Postgres stores
- worker job-name claim scoping
- failback reconciliation
- Railway live drill harness and proof status
- known preview/beta limitations

4. Update README maturity language from "developer-preview package skeleton" to the selected release label only after Phase 03 evidence passes.
5. Keep a clear warning that BatonKit is not production-stable unless production-stable criteria are actually met.
6. Update `docs/release.md` with final pre-publish gates and explicit "do not publish until" criteria.
7. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run test:pack
npm run lint
npm audit --omit=dev
```

8. If version/package exports changed, inspect packed tarball output from `npm run test:pack`.
9. Review this phase and update `Phase Review`.
10. Commit:

```bash
git add .
git commit -m "docs: prepare public beta release metadata"
```

## Acceptance Criteria

- Package versions and release docs describe the same maturity level.
- README explains what is beta-ready and what still requires user wiring.
- Changelog or release notes summarize the complete release candidate.
- Public API names are reviewed and still generic.
- Package smoke test passes after metadata changes.
- The phase is reviewed, documented, and committed separately.

## Completion Notes

- Selected release label: `0.1.0-beta.0`.
- Updated package versions and internal `@batonkit/*` dependency pins across public packages and examples.
- Updated README, CHANGELOG, release process docs, and Railway live drill evidence to describe public beta candidate status.
- Verification commands:

```bash
npm run build          # passed
npm run typecheck      # passed
npm run test           # passed: 60 passed, 2 skipped
npm run test:pack      # passed
npm run lint           # passed
npm audit --omit=dev   # passed: 0 vulnerabilities
```

## Phase Review

- Status: complete. Release metadata and docs now consistently describe BatonKit as `0.1.0-beta.0`, a public beta candidate rather than a production-stable queue.
- Regression risk: low. Package metadata and documentation changed, with no queue, worker, Postgres, or provider runtime logic changed in this phase.
- API clarity: improved. The docs now distinguish public beta from production stability and explain the Railway provider `park()` behavior without implying service suspension.
- Overengineering: avoided. No new release automation or publishing scripts were added.
- Test gaps: addressed for this phase. Build, typecheck, unit tests, pack smoke, lint, and audit passed after metadata changes.
- Docs gaps: addressed. README, CHANGELOG, release docs, and Railway live drill evidence now share the same maturity story.
- Performance/cost impact: neutral. No caching, database query shape, background work, external API usage, storage, or provider cost behavior changed in this phase.
- Security impact: neutral to positive. Docs continue to require bearer auth for control-plane details and do not include secret values.
- Public-package ergonomics: improved because npm metadata now has an installable beta version and the README tells adopters what wiring they still own.
- Later phase update: Phase 05 can make the final decision against public beta readiness rather than private preview only.

## Completion Checklist

- [x] Release label selected
- [x] Package versions updated if approved by evidence
- [x] Changelog or release notes updated
- [x] README maturity language updated
- [x] Release docs updated
- [x] Package smoke test passes
- [x] Phase review completed
- [x] Phase document updated
- [x] Later phase documents updated if needed
- [x] Phase committed
