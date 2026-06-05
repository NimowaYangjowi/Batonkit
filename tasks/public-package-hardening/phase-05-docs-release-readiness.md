# Phase 05: Docs Release Readiness

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
> - Documentation-only edits must still be reviewed against implemented behavior and verified commands.

## Goal

Update public docs, examples, and release gates so a third-party evaluator can tell exactly what is production-ready and what remains preview-only.

## User-Facing Risk

BatonKit has strong positioning, but public trust depends on accurate maturity signals. If docs promise behavior that still needs user wiring, users will lose confidence even when the underlying package is useful.

## Files

- Modify: `README.md`
- Modify: `docs/api-reference.md`
- Modify: `docs/queue-core.md`
- Modify: `docs/worker-runtime.md`
- Modify: `docs/control-plane.md`
- Modify: `docs/failover.md`
- Modify: `docs/release.md`
- Modify package READMEs as needed
- Update this phase document

## Documentation Tasks

1. Re-read implemented behavior from Phases 01-04.
2. Update README quick start so it includes all required production wiring.
3. Add a "Known Preview Limitations" section if any major operational gap remains.
4. Make route security, heartbeat responsibility, failback reconciliation, and job-name scoping explicit.
5. Update API reference with exact option fields and defaults.
6. Update release docs with the remaining blockers before npm beta.
7. Verify example READMEs do not imply in-memory demos are production-ready.
8. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run test:postgres
npm run test:pack
npm run drill:failover
npm run drill:railway-live
npm run lint
npm audit --omit=dev
```

9. If Railway remote behavior was touched in any earlier phase, also run:

```bash
npm run drill:railway-live:remote
```

10. Review this phase and update `Phase Review`.
11. Commit:

```bash
git add .
git commit -m "docs: harden public package readiness guidance"
```

## Acceptance Criteria

- README explains the real setup path without hiding required wiring.
- API reference matches exported TypeScript behavior.
- Docs name the preview limitations honestly.
- Release process names every required command before npm publication.
- No docs claim a feature is automatic unless the package provides it.
- The phase is committed independently.

## Phase Review

- Regression risk: low. This phase only updates documentation and release guidance to match behavior already implemented in earlier phases.
- API clarity: improved. README and docs now call out worker job-name scoping, optional worker heartbeats, authenticated control reads, custom job IDs, and failback reconciliation.
- Overengineering: avoided. No new process or framework was added; docs point to existing commands and package APIs.
- Test gaps: acceptable for this phase. Documentation was checked against the implemented behavior and the full requested local verification set was run.
- Docs gaps: addressed in README, queue docs, control-plane docs, release docs, API docs, and relevant package READMEs.
- Performance/cost impact: neutral. The only runtime-related note is that heartbeat interval is configurable and failback reconciliation is caller-scheduled.
- Security impact: improved in documentation. The docs now state that control-plane reads are locked by default unless `publicRead: true` is chosen deliberately.
- Public-package ergonomics: improved because the quick start no longer hides required production wiring.
- Later phase update: not required. This is the final phase in the hardening plan.

## Completion Checklist

- [x] README updated
- [x] API reference updated
- [x] Worker, control-plane, and failover docs updated
- [x] Release gates updated
- [x] Example docs checked
- [x] Verification commands pass
- [x] Phase review completed
- [x] Phase committed
- [x] Later phase documents updated if needed
