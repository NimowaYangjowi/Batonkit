# Next.js + Postgres Example

This example will show how a small Next.js/Vercel app can enqueue background jobs, run a local worker, and fail over to a cloud backup worker.

## Run Locally

Install this example separately from the repository root:

```bash
cd examples/next-postgres
npm install
export BATONKIT_CONTROL_SECRET=replace-with-a-local-dev-secret
npm run dev
```

Run a local worker in another terminal:

```bash
npm run worker:local
```

Run a backup worker in another terminal:

```bash
npm run worker:backup
```

This example uses in-memory stores so the shape stays easy to inspect. A real app should replace `lib/localfirst.ts` with a Postgres-backed store.

The control route requires `Authorization: Bearer <BATONKIT_CONTROL_SECRET>` for both reads and writes.
