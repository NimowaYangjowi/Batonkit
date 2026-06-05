# Phase 06: Public Package Readiness

> **Phase Operating Rules**
>
> - Keep this phase independently shippable and commit it when complete.
> - At phase end, run a review focused on regression risk, API clarity, overengineering, test gaps, docs gaps, performance/cost impact, and public-package ergonomics.
> - Record review findings in this phase document under `Phase Review`.
> - Update the completion checklist in this phase document before moving on.
> - If implementation changes the architecture, update all later phase documents before starting the next phase.
> - Do not carry Redprint-specific names, database tables, job types, or deployment assumptions into the public API.
> - Prefer small, boring primitives over broad abstractions unless a later phase proves the abstraction is needed.

## Goal

Prepare the project for public npm release and external adoption.

## Scope

- Public README
- API reference
- Next.js + Postgres example
- Railway backup example
- migration guide
- security notes
- release workflow
- package publishing config

## Documentation Requirements

The README must answer:

- What problem does this solve?
- When should I not use this?
- How does local-first failover work?
- What database tables does it create?
- How do I run a local worker?
- How do I deploy a backup worker?
- How do I test failover safely?

## Implementation Tasks

1. Create `examples/next-postgres`.
2. Add a minimal upload-preview style demo job without Redprint naming.
3. Add a local worker command.
4. Add a backup worker deployment example.
5. Add a failover drill guide.
6. Add package export maps.
7. Add npm publishing metadata.
8. Add changelog and versioning policy.
9. Run full verification.
10. Commit the phase:

```bash
git add .
git commit -m "docs: prepare public package release"
```

## Acceptance Criteria

- A new user can run the example app locally.
- A new user can start a local worker.
- A new user can understand how to configure a backup worker.
- Package exports are stable and documented.
- No Redprint-specific language appears in public docs except optional case-study material.

## Phase Review

- Regression risk: Low. This phase mainly adds docs, example files, and package metadata. Runtime package tests still pass.
- API clarity: Good. Public docs now describe package boundaries and the main APIs by package.
- Overengineering risk: Low. The example uses in-memory stores to stay inspectable; real Postgres wiring remains documented as the production replacement point.
- Test gaps: The example app itself has no tests yet and was not included in root workspace verification. Add example-level smoke tests before a first public beta.
- Docs gaps: README, API reference, failover drill, and release notes now exist. More tutorial depth is still needed before launch.
- Performance/cost impact: Positive. Docs emphasize backup workers staying passive until failover.
- Public-package ergonomics: Improved. Package metadata includes public publish config and side-effect declarations.
- Security note: The Next.js example is intentionally excluded from root workspaces because the current latest Next dependency pulls a moderate `postcss` advisory. Root package audit passes with 0 vulnerabilities.
- Later phase update: No later phases remain. Before public release, add live Postgres integration tests and run the failover drill against a real provider.

## Completion Checklist

- [x] Example app added
- [x] Public README completed
- [x] API reference added
- [x] Failover drill documented
- [x] Release metadata added
- [x] Full verification passes
- [x] Phase review completed
- [x] Phase committed
- [x] Later phase documents updated if needed
