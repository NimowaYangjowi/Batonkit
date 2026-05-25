# Phase 05: Local-First Failover

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

Add automatic failover and failback behavior with provider adapters.

Plain language: if the local worker stops answering, let the cloud backup worker take the baton; when local is stable again, hand the baton back.

## Scope

- Monitor webhook parser
- Failover decision engine
- Failback cooldown
- Provider adapter interface
- Railway provider adapter
- Wake/ready/refresh/park lifecycle

## Public API Sketch

```ts
import { createFailoverHandler } from '@localfirst/worker/next';
import { railwayProvider } from '@localfirst/worker/provider-railway';

export const POST = createFailoverHandler({
  store,
  provider: railwayProvider({
    readyUrl: process.env.BACKUP_WORKER_READY_URL,
    refreshSecret: process.env.LOCALFIRST_WORKER_SECRET,
  }),
  failbackCooldownMs: 300_000,
});
```

`failbackCooldownMs` is the waiting period before returning work to local. It prevents rapid switching when a home network or local machine is unstable.

## Implementation Tasks

1. Write failing tests for local-down failover decision.
2. Implement failover transition to backup owner.
3. Write failing tests for local-up cooldown.
4. Implement failback cooldown and restoration.
5. Define provider adapter interface.
6. Implement Railway provider adapter.
7. Write failing tests for wake failure rollback behavior.
8. Add monitor webhook helper for generic down/up events.
9. Add docs for Hetrix and UptimeRobot style integrations without making either a hard dependency.
10. Run build, typecheck, and tests.
11. Commit the phase:

```bash
git add .
git commit -m "feat: add local first failover"
```

## Acceptance Criteria

- Local-down event switches active owner to backup.
- Backup wake is attempted after ownership change.
- Failed wake rolls ownership back safely.
- Local-up event starts cooldown before failback.
- Provider interface is not Railway-specific.
- Railway adapter is the first concrete provider.

## Phase Review

To be completed after implementation.

## Completion Checklist

- [ ] Failover decision engine added
- [ ] Failback cooldown added
- [ ] Provider interface added
- [ ] Railway provider added
- [ ] Monitor webhook helper added
- [ ] Tests pass
- [ ] Phase review completed
- [ ] Phase committed
- [ ] Later phase documents updated if needed

