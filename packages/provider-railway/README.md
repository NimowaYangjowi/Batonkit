# @batonkit/provider-railway

Railway backup provider adapter for BatonKit.

## Install

```bash
npm install @batonkit/core @batonkit/provider-railway
```

## What It Includes

- `railwayProvider(...)` for triggering Railway backup wake-ups

Use this when your standby worker lives on Railway and you want BatonKit's failover flow to call Railway in a reusable, provider-shaped way.

## Behavior Notes

- `wake()` checks the backup worker's public `/ready` door and then refreshes `/control-plane/refresh`
- `park()` refreshes `/control-plane/refresh` again so the standby side stays aligned with the control plane
