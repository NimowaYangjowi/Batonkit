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

## User-Facing Risk

`examples/next-postgres/app/api/control/route.ts` falls back to `dev-secret` when no environment secret is configured. A user may copy that route into a real app and accidentally expose control-plane reads and writes with a known secret.

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

- Regression risk: low. The changed route now fails clearly when the control API secret is missing, which can affect only users who relied on the example's unsafe implicit secret.
- API clarity: improved. The example now matches the root README and control-plane docs by requiring `BATONKIT_CONTROL_SECRET`.
- Overengineering: avoided. A small local helper enforces the invariant without adding new abstractions or alternate code paths.
- Test gaps: acceptable. The route is part of a standalone example app without its own route test suite; root build, typecheck, unit tests, lint, and audit passed.
- Docs gaps: addressed. The example README now names the required secret and the bearer authorization requirement for the user-visible control API door.
- Performance/cost impact: neutral. No runtime queue behavior, batching, query shape, external API use, storage, or infrastructure behavior changed.
- Security impact: improved. The sample no longer teaches a known default control-plane secret.
- Public-package ergonomics: improved because copied setup now fails fast if the operator forgot the control secret.
- Later phase update: not required. The remaining verification and release metadata phases still apply.

## Completion Notes

- Removed the `dev-secret` fallback from `examples/next-postgres/app/api/control/route.ts`.
- Removed the `LOCALFIRST_WORKER_SECRET` alias from the example route so the public example uses the BatonKit-specific `BATONKIT_CONTROL_SECRET` name.
- Updated `examples/next-postgres/README.md` with the required local secret export and bearer-auth explanation.
- Verification commands:

```bash
npm run build        # passed
npm run typecheck    # passed
npm run test         # passed: 60 passed, 2 skipped
npm run lint         # passed
npm audit --omit=dev # passed: found 0 vulnerabilities
```

## Completion Checklist

- [x] Unsafe secret fallback removed
- [x] Example secret setup documented
- [x] Tests added or updated if useful
- [x] Verification commands pass
- [x] Phase review completed
- [x] Phase document updated
- [x] Later phase documents updated if needed
- [x] Phase committed
