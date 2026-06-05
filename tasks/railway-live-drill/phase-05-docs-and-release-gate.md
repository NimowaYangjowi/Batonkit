# Phase 05: Docs And Release Gate

> **Phase Operating Rules**
>
> - Keep this phase independently shippable and commit it when complete.
> - At phase end, run a review focused on regression risk, API clarity, overengineering, test gaps, docs gaps, performance/cost impact, secret safety, and public-package ergonomics.
> - Record review findings in this phase document under `Phase Review`.
> - Update the completion checklist in this phase document before moving on.
> - If implementation changes the architecture, update all later phase documents before starting the next phase.
> - Do not carry any product-specific names, database tables, job types, deployment secrets, or UI concepts into the public API.
> - Keep Railway as one provider adapter; do not make Railway required by core.
> - Use TDD for code behavior changes; documentation-only edits must still be reviewed against the live drill result.

## Goal

Update public docs and release gates based on the real Railway drill.

## Files

- Update: `README.md`
- Update: `docs/failover-drill.md`
- Update: `docs/release.md`
- Update: `docs/railway-live-drill.md`
- Update: `AGENTS.md`
- Update this phase document

## Tasks

1. Add a Railway live drill section to README.
2. Update `docs/failover-drill.md` with real Railway steps.
3. Update `docs/release.md` to state whether Railway live drill is now complete.
4. Update `AGENTS.md` with live drill verification commands.
5. Document any known limitations:
   - Railway sleep behavior
   - public URL requirement
   - Postgres connection limits
   - cleanup expectations
6. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run test:postgres
npm run test:pack
npm run drill:failover
npm run lint
npm audit --omit=dev
```

7. Review and commit:

```bash
git add .
git commit -m "docs: document railway live drill"
```

## Acceptance Criteria

- README accurately describes the live Railway drill status.
- Release docs clearly state remaining blockers before public beta.
- AGENTS guide tells future agents how to rerun the live drill.
- No secrets or private URLs are committed unless intentionally public and safe.
- If Railway resources remain active, cost and teardown notes are documented.

## Phase Review

- Regression risk: low. These changes are documentation and release-gate updates plus a small drill-related configuration improvement for Railway runtime port handling.
- API clarity: improved. The docs now clearly separate the local self-contained drill from the real Railway-backed remote drill.
- Overengineering: avoided. The release gate adds one extra verification command rather than creating a separate release process.
- Test gaps: acceptable for this phase. The docs are grounded in a committed live result document from 2026-05-26.
- Docs gaps: addressed in `README.md`, `docs/failover-drill.md`, `docs/release.md`, `docs/railway-live-drill.md`, `docs/live-drill-results/2026-05-26-railway-live-drill.md`, `AGENTS.md`, and `examples/railway-live-drill/README.md`.
- Performance/cost impact: documented. The retained lab project and Railway Postgres are explicitly called out so future maintainers understand the ongoing cost surface.
- Secret safety: preserved. No live secret values or private internal URLs were committed.
- Public-package ergonomics: improved because the repository now tells future users exactly how to rerun both the local drill and the real Railway drill.

## Completion Checklist

- [x] README updated
- [x] Failover drill docs updated
- [x] Release docs updated
- [x] AGENTS updated
- [x] Known limitations documented
- [x] Verification commands pass
- [x] Phase review completed
- [x] Phase committed
- [x] Later phase documents updated if needed
