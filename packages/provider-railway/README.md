# @batonkit/provider-railway

Railway backup provider adapter for BatonKit.

Plain language: this is the package that knows how to wake up a backup worker running on Railway. It is one cloud-provider plug, not the center of BatonKit itself.

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

Plain language: this adapter helps BatonKit knock on the Railway worker's public green-light door, then uses the secret refresh door for private control state. It does not magically power the Railway service off. If you want true scale-to-zero behavior, that still needs Railway-side deployment or platform settings outside BatonKit itself.
