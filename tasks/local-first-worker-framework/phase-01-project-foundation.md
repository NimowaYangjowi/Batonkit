# Phase 01: Project Foundation

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

Create the standalone repository foundation for the public npm package.

Plain language: make the empty workshop ready before building the machine.

## Scope

- Initialize package manager and TypeScript config.
- Choose monorepo tooling.
- Add lint, format, test, and build commands.
- Add package naming conventions.
- Add public license and README skeleton.
- Add contribution and release notes placeholders.

## Recommended Structure

```txt
local-first-worker/
├─ packages/
│  ├─ core/
│  ├─ postgres/
│  ├─ worker/
│  ├─ next/
│  ├─ provider-railway/
│  └─ monitor-webhook/
├─ examples/
│  └─ next-postgres/
├─ docs/
├─ tasks/
└─ package.json
```

## Implementation Tasks

1. Create a TypeScript workspace.
2. Add `packages/core` with no runtime dependencies except small validation utilities if needed.
3. Add `packages/postgres` for DB schema and query code.
4. Add `packages/worker` for process/runtime code.
5. Add `packages/next` for Next.js integration helpers.
6. Add `packages/provider-railway` and `packages/monitor-webhook` as empty package shells.
7. Add `vitest`, `typescript`, and lint tooling.
8. Add CI-ready scripts:
   - `npm run build`
   - `npm run test`
   - `npm run typecheck`
   - `npm run lint`
9. Commit the phase:

```bash
git add .
git commit -m "chore: initialize local first worker workspace"
```

## Acceptance Criteria

- A fresh clone can install dependencies.
- TypeScript builds with no emitted package code yet.
- Test command runs successfully.
- README explains the product boundary in one short paragraph.
- No Redprint-specific public API appears anywhere.

## Phase Review

To be completed after implementation.

## Completion Checklist

- [ ] Workspace initialized
- [ ] Package shells created
- [ ] Tooling commands added
- [ ] Tests/typecheck/lint pass
- [ ] Phase review completed
- [ ] Phase committed
- [ ] Later phase documents updated if needed

