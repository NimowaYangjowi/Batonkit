# @batonkit/monitor-webhook

Generic monitor webhook parsing helpers for BatonKit.

## Install

```bash
npm install @batonkit/core @batonkit/monitor-webhook
```

## What It Includes

- `parseMonitorWebhookEvent(...)` for generic `status` or `event` payloads
- support for `down`, `failed`, `offline`, `up`, `recovered`, and `online`

If your monitoring tool sends a different payload shape, add a tiny adapter in your route handler and then pass the normalized values into BatonKit.
