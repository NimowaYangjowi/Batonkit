# Contributing

Thanks for helping improve Local First Worker.

## Development

Run these checks before opening a pull request:

```bash
npm run build
npm run typecheck
npm run test
npm run lint
```

## Product Boundary

Keep the public API generic. Redprint can be a case study or first adopter, but core packages must not depend on Redprint-specific schema names, job names, UI modules, or deployment secrets.

