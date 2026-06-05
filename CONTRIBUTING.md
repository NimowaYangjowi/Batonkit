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

## Pull Request Notes

Please mention:

- what user-facing behavior changed
- which verification commands you ran
- whether docs or examples were updated

## Product Boundary

Keep the public API generic. Redprint can be a case study or first adopter, but core packages must not depend on Redprint-specific schema names, job names, UI modules, or deployment secrets.
