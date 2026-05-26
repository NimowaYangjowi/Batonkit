# Changelog

All notable changes to this project will be documented in this file.

This project is pre-release.

## 0.0.0

- Added initial queue, worker runtime, control-plane, failover, and provider package scaffolding.
- Hardened worker health reporting so fatal polling-loop failures surface as degraded heartbeats instead of looking healthy.
- Aligned duplicate caller-provided job ID behavior so both memory and Postgres queues reject duplicate reuse.
- Added control-plane request validation so malformed JSON and invalid control events fail with clear `400` responses.
