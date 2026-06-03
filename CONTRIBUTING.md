# Contributing

Thanks for helping improve BatonKit.

## Development

Run these checks before opening a pull request:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
npm audit --omit=dev
```

Add the checks below when your change touches these areas:

- Postgres queue or control-plane behavior: `npm run test:postgres`
- Package installability or publish artifacts: `npm run test:pack`
- Failover logic or failback timing: `npm run drill:failover`
- Railway live drill harness or runbook: `npm run drill:railway-live`

Plain language: if you changed the shared database-backed baton logic, run the real database test. If you changed how the package is packed for npm, run the fake consumer install test. If you changed the emergency handoff behavior, run the handoff drill too.

## Pull Request Notes

Please mention:

- what user-facing behavior changed
- which verification commands you ran
- whether docs or examples were updated

Plain language: think of this as the note you would leave for the next teammate so they can tell what changed, how you tested it, and where to look first.

## Product Boundary

Keep the public API generic. Redprint can be a case study or first adopter, but core packages must not depend on Redprint-specific schema names, job names, UI modules, or deployment secrets.
