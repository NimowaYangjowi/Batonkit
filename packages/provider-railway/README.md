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
