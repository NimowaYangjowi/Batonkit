# Phase 04: Next.js Control Plane

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

Add Next.js/Vercel-friendly control-plane helpers.

Plain language: give the web app a small control desk where workers can report health and external monitors can report outages.

## Scope

- Worker heartbeat table
- Ownership state table
- Next.js route handler helpers
- `/ready` and `/health` response helpers
- Worker claim gating based on active owner
- Local and backup platform concepts

## Public API Sketch

```ts
import { createControlPlaneHandlers } from '@localfirst/worker/next';

export const { GET, POST } = createControlPlaneHandlers({
  store,
  secret: process.env.LOCALFIRST_WORKER_SECRET,
});
```

In UI terms, this powers the status card that says whether the local worker or backup worker is currently allowed to process background jobs.

## Implementation Tasks

1. Write failing tests for default ownership state.
2. Add control-plane migration SQL.
3. Implement ownership read/update APIs.
4. Write failing tests for worker heartbeat recording.
5. Implement heartbeat API.
6. Write failing tests for claim gating.
7. Connect worker runtime claim checks to ownership state.
8. Add Next.js route handler helpers.
9. Add docs for Vercel deployment and secrets.
10. Run build, typecheck, and tests.
11. Commit the phase:

```bash
git add .
git commit -m "feat: add nextjs control plane"
```

## Acceptance Criteria

- Default mode allows local worker claims.
- Backup worker cannot claim while local is active.
- Heartbeats are stored and queryable.
- Route helpers work in Next.js App Router.
- Secrets are required for mutating control endpoints.

## Phase Review

To be completed after implementation.

## Completion Checklist

- [ ] Ownership state added
- [ ] Heartbeat state added
- [ ] Claim gating implemented
- [ ] Next.js route helpers added
- [ ] Security checks added
- [ ] Tests pass
- [ ] Phase review completed
- [ ] Phase committed
- [ ] Later phase documents updated if needed

