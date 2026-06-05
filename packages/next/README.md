# @batonkit/next

Next.js App Router helpers for BatonKit control-plane routes.

## Install

```bash
npm install @batonkit/core @batonkit/next
```

## What It Includes

- `createControlPlaneHandlers(...)` for App Router `GET` and `POST` handlers

Use this when your product is built on Next.js and you want a small, reusable control route instead of hand-writing the request parsing and response logic yourself.

Both `GET` and `POST` require `Authorization: Bearer <secret>` by default.

For `POST`, BatonKit expects either a heartbeat update or an ownership update JSON body, and it now rejects malformed bodies with a clear `400` response before calling deeper control-store logic.
