# Changelog

All notable changes to this project will be documented in this file.

This project is in public beta candidate status.

## 0.1.0-beta.0 - 2026-06-04

- Promoted the package metadata to the first public beta candidate.
- Kept the Next.js control route private by default, including authenticated reads unless `publicRead: true` is explicitly set.
- Required the example app's `BATONKIT_CONTROL_SECRET` instead of silently falling back to a development secret.
- Hardened worker heartbeat reporting so fatal polling-loop failures surface as degraded heartbeats instead of looking healthy.
- Aligned duplicate caller-provided job ID behavior so both memory and Postgres queues reject duplicate reuse.
- Scoped worker claims to registered job names so a worker process only takes jobs it can actually run.
- Added failback reconciliation so ownership can return to local after a cooldown.
- Added Railway live drill coverage and a completed Railway lab proof run with local-to-backup-to-local handoff.
- Clarified that the Railway provider's `park()` step refreshes the standby control-plane door and does not suspend the Railway service by itself.
- Known beta limitations: users still own migration execution, monitor webhook wiring, worker process management, periodic failback reconciliation, and provider-specific service scaling.

## 0.0.0

- Added initial queue, worker runtime, control-plane, failover, and provider package scaffolding.
- Hardened worker health reporting so fatal polling-loop failures surface as degraded heartbeats instead of looking healthy.
- Aligned duplicate caller-provided job ID behavior so both memory and Postgres queues reject duplicate reuse.
- Added control-plane request validation so malformed JSON and invalid control events fail with clear `400` responses.
