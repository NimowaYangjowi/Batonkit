# BatonKit Railway Live Drill Plan

> **For implementers:** Execute the phase documents in order. Each phase is a separate, reviewable product slice. At the end of every phase, commit the work, review regression risk and improvements, update that phase's completion notes, and update later phase documents if implementation changed the remaining plan.

## Goal

Validate BatonKit against a real Railway project, not only local simulations.

Plain language: prove that a real Railway backup worker can wake up, receive the baton, claim work from Postgres, process a harmless job, and hand ownership back to local.

## Why This Exists

BatonKit already has:

- in-memory unit tests
- real Postgres queue integration tests
- npm pack consumer tests
- local simulated failover drill

What is still missing is the end-to-end live provider proof:

- real Railway project
- real Railway Postgres
- real backup worker service
- real public `/ready` and `/control-plane/refresh`
- real local-to-backup-to-local ownership handoff

## Phase Index

1. `phase-01-postgres-control-store.md`
2. `phase-02-live-drill-harness.md`
3. `phase-03-railway-project-setup.md`
4. `phase-04-live-failover-execution.md`
5. `phase-05-docs-and-release-gate.md`

## Non-Goals

- Do not publish BatonKit to npm during this drill.
- Do not connect to any production database.
- Do not use secrets from another product.
- Do not create long-running paid infrastructure without a teardown note.
- Do not make Railway a hard dependency of BatonKit core.

## Naming

Use `batonkit-lab` as the Railway project name unless a conflict requires a suffix.

## Required End State

The drill is complete only when:

- a Railway Postgres-backed control store exists
- a Railway backup worker can process a queued job
- local ownership can fail over to backup
- backup ownership can fail back to local
- the live drill runbook is documented
- all resources are either cleaned up or explicitly documented as intentionally retained

