# Phase 03: Stable Docs And Operations Runbooks

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

Add the stable-release documentation that was previously listed as a blocker: copy-pasteable tutorial and operations runbooks for failed migrations, stuck leases, degraded workers, and provider outages.

## Tasks

1. Add or update a copy-pasteable fresh Next.js + Postgres tutorial.
2. Add operations guidance for:
   - failed migrations
   - stuck leases
   - degraded worker heartbeats
   - provider outages
   - failback reconciliation
3. Keep docs generic to BatonKit and avoid app-specific tables, secrets, or UI concepts.
4. Link the stable docs from README and `docs/release.md`.
5. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

6. Review this phase and update `Phase Review`.
7. Commit docs separately.

## Acceptance Criteria

- README links to stable setup and operations docs.
- Stable users can see what to do when migrations, leases, workers, or providers fail.
- Docs preserve the package boundary and do not introduce customer-specific concepts.
- The phase is reviewed, documented, and committed separately.

## Completion Notes

- Added `docs/stable-next-postgres-tutorial.md` with install, env, migration, queue, Next.js control route, local worker, monitor, failback, and verification steps.
- Added `docs/operations-runbook.md` with recovery guidance for failed migrations, stuck leases, degraded workers, provider outages, failback reconciliation, and secret/URL safety.
- Linked both stable docs from README.
- Updated `docs/release.md` to name the exact stable tutorial and operations runbook.
- Verification commands:

```bash
npm run build          # passed
npm run typecheck      # passed
npm run test           # passed
npm run lint           # passed
npm audit --omit=dev   # passed: 0 vulnerabilities
```

## Phase Review

- Status: complete. Stable setup and operations docs now exist and are linked.
- Regression risk: low. This phase changed documentation only.
- API clarity: improved. The tutorial explains the user-visible role of each package and route, not just code names.
- Overengineering: avoided. The runbook stays operational and generic rather than adding new runtime abstractions.
- Test gaps: not applicable to docs-only changes; baseline build, typecheck, tests, lint, and audit passed.
- Docs gaps: addressed for stable publish readiness. Phase 04 still needs dry-run artifact inspection.
- Performance/cost impact: none.
- Security impact: positive. The runbook explicitly warns against committing control secrets and private database URLs.
- Public-package ergonomics: improved because stable users now have both setup and rescue guidance.
- Later phase update: Phase 04 can treat stable docs as complete and focus on release gates plus dry-run package contents.

## Completion Checklist

- [x] Copy-pasteable tutorial added or updated
- [x] Operations runbook added or updated
- [x] README linked to stable docs
- [x] Release docs linked to stable docs
- [x] Verification passes
- [x] Phase review completed
- [x] Phase document updated
- [x] Later phase documents updated if needed
- [x] Phase committed
