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

Plain language: this phase opens each box, checks the label, checks the contents, and makes sure npm would accept the package shape.

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

- Pending.

## Phase Review

- Pending.

## Completion Checklist

- [ ] Full release gate passes
- [ ] Publish dry-run passes for all public packages
- [ ] Package contents inspected
- [ ] Secret scan completed
- [ ] Phase review completed
- [ ] Phase document updated
- [ ] Later phase documents updated if needed
- [ ] Phase committed

