# Phase 04: Docs And Release Confidence

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
> - Use TDD for behavior changes when runtime behavior changes in this phase.

## Goal

Refresh public docs and release notes so the hardened behavior is easy for third-party adopters to discover.

## User-Facing Risk

Even good fixes can be missed if the README, package docs, and release notes still describe the old behavior.

## Files

- Possibly modify: `README.md`
- Possibly modify: `docs/api-reference.md`
- Possibly modify: `docs/worker-runtime.md`
- Possibly modify: `docs/queue-core.md`
- Possibly modify: `docs/control-plane.md`
- Possibly modify: package READMEs under `packages/*`
- Possibly modify: `CHANGELOG.md`
- Update this phase document

## Implementation Tasks

1. Audit public docs for the worker degradation path, duplicate job ID behavior, and control-plane request shape.
2. Update any stale examples or wording.
3. Decide whether `CHANGELOG.md` needs a preview hardening entry.
4. Run baseline verification plus any targeted commands still needed after the final diff.
5. Review this phase and update `Phase Review`.
6. Commit:

```bash
git add .
git commit -m "docs: document trust hardening changes"
```

## Acceptance Criteria

- Public docs match the shipped behavior from phases 1 through 3.
- Release notes communicate the most important adopter-facing hardening changes.
- The phase is committed independently.

## Phase Review

- Regression risk: low. This phase only updates release-facing documentation and changelog language to match already-shipped behavior from phases 1 through 3.
- API clarity: improved. Third-party adopters can now find the hardening changes in both reference docs and the changelog.
- Overengineering: avoided. No new release machinery or doc site structure was added.
- Test gaps: acceptable. Earlier phases already verified the shipped runtime behavior; this phase only needs baseline checks to make sure the repo still stays green after doc updates.
- Docs gaps: addressed. The changelog now calls out the most important adopter-facing hardening changes instead of leaving them buried across individual package docs.
- Performance/cost impact: none. Documentation-only phase.
- Security impact: neutral to positive. Better release notes make the control-plane validation change easier for adopters to notice and rely on.
- Public-package ergonomics: improved because adopters can quickly see what became safer before reading every package README.
- Later phase update: not required. This is the final planned phase for this hardening track.

## Completion Checklist

- [x] Docs audited against shipped behavior
- [x] Stale examples updated
- [x] Changelog updated if needed
- [x] Verification commands pass
- [x] Phase review completed
- [x] Phase committed
- [x] Later phase documents updated if needed
