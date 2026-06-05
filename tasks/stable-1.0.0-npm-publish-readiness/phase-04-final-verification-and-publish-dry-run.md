# Phase 04: Final Verification And Publish Dry Run

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

Run every stable release gate and inspect npm publish dry-run artifacts before actual npm publish.

## Tasks

1. Run the full stable gate:

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

2. Run npm publish dry-runs for all public packages:

```bash
for package in core postgres worker next provider-railway monitor-webhook; do
  (cd "packages/$package" && npm publish --dry-run --access public)
done
```

3. Inspect dry-run output for unexpected files, missing dist artifacts, wrong versions, or beta tags.
4. Search the tree for accidental secrets or private database URLs.
5. Review this phase and update `Phase Review`.
6. Commit verification evidence separately.

## Acceptance Criteria

- All release gates pass.
- Dry-run publish output uses `1.0.0`.
- Dry-run package contents include only intended artifacts.
- No secrets or private URLs are found in committed files.
- The phase is reviewed, documented, and committed separately.

## Completion Notes

- Full stable release gate passed:

```bash
npm run build                    # passed
npm run typecheck                # passed
npm run test                     # passed: 60 passed, 2 skipped
npm run test:postgres            # passed: 1 integration file, 2 tests
npm run test:pack                # passed
npm run drill:failover           # passed
npm run drill:railway-live       # passed: local -> backup -> local
npm run drill:railway-live:remote # passed: local -> backup -> local
npm run lint                     # passed
npm audit --omit=dev             # passed: 0 vulnerabilities
```

- Publish dry-run passed with `latest` tag and public access for:
  - `@batonkit/core@1.0.0`
  - `@batonkit/postgres@1.0.0`
  - `@batonkit/worker@1.0.0`
  - `@batonkit/next@1.0.0`
  - `@batonkit/provider-railway@1.0.0`
  - `@batonkit/monitor-webhook@1.0.0`
- Dry-run package contents were limited to each package README, `dist/index.*`, source maps, declaration files, and `package.json`.
- Dry-run emitted npm login warnings because this machine is not authenticated, but dry-run still completed successfully for every package.
- Secret scan found no committed private values; matches were existing Docker test strings or documentation variable names.

## Phase Review

- Status: complete. Full release verification and publish dry-run passed for all public packages.
- Regression risk: low for this phase. No runtime files changed; this phase recorded verification evidence.
- API clarity: unchanged from Phase 03.
- Overengineering: avoided. No publish automation was added before npm auth is confirmed.
- Test gaps: addressed for stable readiness through full release gates and dry-run package inspection.
- Docs gaps: no blocking docs gap remains for publish preparation.
- Performance/cost impact: low. Railway remote drill used existing retained lab resources.
- Security impact: positive. Secret scan was run and actual npm publish remains blocked until auth and scope permission are confirmed.
- Public-package ergonomics: strong. All public packages dry-run as `1.0.0` with intended package contents.
- Later phase update: Phase 05 only needs account login/scope confirmation plus actual publish decision.

## Completion Checklist

- [x] Full release gate passes
- [x] Publish dry-run passes for all public packages
- [x] Package contents inspected
- [x] Secret scan completed
- [x] Phase review completed
- [x] Phase document updated
- [x] Later phase documents updated if needed
- [x] Phase committed
