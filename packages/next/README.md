# @batonkit/next

Next.js App Router helpers for BatonKit control-plane routes.

Plain language: this is the package that helps your Next.js app expose the secure webhook door that outside systems can knock on. Your monitor or your backup worker can call that route to say "the local worker is down" or "the local worker is healthy again."

## Install

```bash
npm install @batonkit/core @batonkit/next
```

## What It Includes

- `createControlPlaneHandlers(...)` for App Router `GET` and `POST` handlers

Use this when your product is built on Next.js and you want a small, reusable control route instead of hand-writing the request parsing and response logic yourself.

Both `GET` and `POST` require `Authorization: Bearer <secret>` by default. Plain language: the status door and the control door are locked unless you explicitly pass `publicRead: true`.
