# Local First Worker

Public npm package project for a Postgres-first, local-first background worker framework.

The framework is intended for small teams using Next.js/Vercel + Postgres who want to run background jobs on local hardware first, then fail over to a sleeping cloud backup worker when the local worker is unavailable.

## Planning Entry

Start here:

- `tasks/local-first-worker-framework/README.md`

## Product Boundary

This project should not contain Redprint-specific concepts in its public API.

Redprint can be the first real-world adopter, but package names, database tables, job types, and examples must remain generic enough for other projects.

