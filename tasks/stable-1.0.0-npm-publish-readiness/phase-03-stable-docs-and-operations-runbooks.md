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

Plain language: stable users need instructions for both setup and rescue, not just the happy path.

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

- Pending.

## Phase Review

- Pending.

## Completion Checklist

- [ ] Copy-pasteable tutorial added or updated
- [ ] Operations runbook added or updated
- [ ] README linked to stable docs
- [ ] Release docs linked to stable docs
- [ ] Verification passes
- [ ] Phase review completed
- [ ] Phase document updated
- [ ] Later phase documents updated if needed
- [ ] Phase committed

