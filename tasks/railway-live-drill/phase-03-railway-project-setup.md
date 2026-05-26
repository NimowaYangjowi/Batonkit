# Phase 03: Railway Project Setup

> **Phase Operating Rules**
>
> - Keep this phase independently shippable and commit it when complete.
> - At phase end, run a review focused on regression risk, API clarity, overengineering, test gaps, docs gaps, performance/cost impact, secret safety, and public-package ergonomics.
> - Record review findings in this phase document under `Phase Review`.
> - Update the completion checklist in this phase document before moving on.
> - If implementation changes the architecture, update all later phase documents before starting the next phase.
> - Do not carry any product-specific names, database tables, job types, deployment secrets, or UI concepts into the public API.
> - Keep Railway as one provider adapter; do not make Railway required by core.
> - Use TDD for code behavior changes; for Railway CLI steps, record exact commands and observed results.

## Goal

Create an isolated Railway project named `batonkit-lab` and deploy the live drill harness.

Plain language: set up a safe cloud practice field for BatonKit.

## Files

- Create: `docs/railway-live-drill.md`
- Create or update: `examples/railway-live-drill/railway.json` or `railway.toml` if needed
- Update: `docs/release.md`
- Update this phase document

## Railway Resources

- Project: `batonkit-lab`
- Database: Railway Postgres
- Service: `backup-worker`
- Optional service: `control-test` only if the harness needs a separate HTTP control surface

## Tasks

1. Confirm Railway CLI authentication:

```bash
railway whoami
```

2. Create or link the project:

```bash
railway init --name batonkit-lab
```

3. Add Railway Postgres from the dashboard or CLI, depending on available CLI support.
4. Configure service env vars:

```txt
BATONKIT_DATABASE_URL=<Railway Postgres URL>
BATONKIT_CONTROL_SECRET=<new test-only secret>
BATONKIT_PLATFORM=backup
```

5. Deploy the harness:

```bash
railway up
```

6. Record:
   - project id/name
   - service name
   - public URL
   - cleanup instructions
7. Run local verification against the public `/ready` endpoint.
8. Commit docs/config:

```bash
git add .
git commit -m "docs: configure railway live drill project"
```

## Acceptance Criteria

- Railway project is isolated from all other products.
- Railway service has no production secrets.
- Public URL responds on `/ready`.
- Cleanup or retention decision is written down.
- Docs include exact setup commands and any manual dashboard steps.

## Phase Review

- Regression risk: low. The Railway-specific work stays in the lab project, service variables, and documentation, without changing BatonKit public runtime contracts.
- API clarity: preserved. Railway remains a provider adapter and deployment target, not a new core package requirement.
- Overengineering: avoided. The live drill uses one service plus one Postgres database and reuses the existing drill harness instead of adding a second control test app.
- Test gaps: acceptable for this phase. The setup itself is now proven by a public `/ready` response and by the later live failover execution.
- Docs gaps: addressed in `docs/railway-live-drill.md` with the exact project id, URL, provisioning path, and retention decision.
- Performance/cost impact: limited to one retained lab project with one backup worker service and one Railway Postgres database.
- Secret safety: satisfied. The control secret is test-only and was stored in Railway variables, not committed to the repository.
- Public-package ergonomics: improved because future maintainers now have an isolated lab project and a concrete setup flow to reproduce.

## Completion Checklist

- [x] Railway auth confirmed
- [x] `batonkit-lab` project created or linked
- [x] Railway Postgres added
- [x] Backup worker service created
- [x] Backup worker service deployed
- [x] `/ready` verified
- [x] Docs updated with exact observed values
- [x] Phase review completed
- [ ] Phase committed
- [x] Later phase documents updated if needed
