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

Plain language: make the label match the box. If this is beta, the package, README, and release notes should all say beta-level things.

## User-Facing Risk

Current package versions are `0.0.0`, and docs still say pre-release. That is honest, but it is not yet a clear beta candidate. A public beta needs versioning, changelog context, and a crisp "what is ready versus what still requires operator setup" statement.

Plain language: customers should not have to guess whether they are looking at a rough draft or a release candidate.

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

## Phase Review

- Pending.

## Completion Checklist

- [ ] Release label selected
- [ ] Package versions updated if approved by evidence
- [ ] Changelog or release notes updated
- [ ] README maturity language updated
- [ ] Release docs updated
- [ ] Package smoke test passes
- [ ] Phase review completed
- [ ] Phase document updated
- [ ] Later phase documents updated if needed
- [ ] Phase committed
