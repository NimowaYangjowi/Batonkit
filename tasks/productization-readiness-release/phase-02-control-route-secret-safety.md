# Phase 02: Control Route Secret Safety

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
> - When using `/ship`, do not run the full workflow from `main`; switch to a `codex/` feature branch first.

## Goal

Remove unsafe secret fallback behavior from the user-visible Next.js example and document the expected development setup.

Plain language: the example control door should not quietly use a weak default key. Users should set their own key before the door opens.

## User-Facing Risk

`examples/next-postgres/app/api/control/route.ts` falls back to `dev-secret` when no environment secret is configured. A user may copy that route into a real app and accidentally expose control-plane reads and writes with a known secret.

Plain language: a sample should not teach people to leave the front door key under the mat.

## Files

- Modify: `examples/next-postgres/app/api/control/route.ts`
- Modify: `examples/next-postgres/README.md`
- Modify package or root docs only if the public setup guidance needs clarification
- Add or update tests if the example route becomes directly testable
- Update this phase document

## Tasks

1. Replace the `dev-secret` fallback with a small required-secret helper for the example route.
2. Preserve compatibility with the preferred `BATONKIT_CONTROL_SECRET` name.
3. Decide whether `LOCALFIRST_WORKER_SECRET` should remain as a documented legacy alias or be removed from the example.
4. Make missing secret state fail clearly during development startup or route module loading.
5. Update the example README with:

- required `BATONKIT_CONTROL_SECRET`
- local development command shape
- the fact that both control `GET` and `POST` require `Authorization: Bearer <secret>`

6. Run:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

7. If tests are added or package exports change, also run:

```bash
npm run test:pack
```

8. Review this phase and update `Phase Review`.

9. Commit:

```bash
git add examples/next-postgres/app/api/control/route.ts examples/next-postgres/README.md tasks/productization-readiness-release/phase-02-control-route-secret-safety.md
git commit -m "fix: require explicit control secret in example"
```

## Acceptance Criteria

- The example control route does not use `dev-secret`.
- Missing example control secret fails clearly instead of guessing a value.
- Example docs tell users exactly how to provide the secret.
- Baseline checks pass.
- The phase is reviewed, documented, and committed separately.

## Phase Review

- Pending.

## Completion Checklist

- [ ] Unsafe secret fallback removed
- [ ] Example secret setup documented
- [ ] Tests added or updated if useful
- [ ] Verification commands pass
- [ ] Phase review completed
- [ ] Phase document updated
- [ ] Later phase documents updated if needed
- [ ] Phase committed
