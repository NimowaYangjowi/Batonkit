import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';

import { createGatedStore, createJobs } from '@batonkit/core';

import {
  createControlPlaneMigrationSql,
  createQueueMigrationSql,
  postgresControlStore,
  postgresStore,
} from './index.js';

const { Pool } = pg;

const databaseUrl = process.env.BATONKIT_TEST_DATABASE_URL;

describe.runIf(databaseUrl)('postgres integration', () => {
  const pool = new Pool({ connectionString: databaseUrl });

  beforeAll(async () => {
    await pool.query(createQueueMigrationSql());
    await pool.query(createControlPlaneMigrationSql());
    await pool.query('TRUNCATE lfw_job_events, lfw_jobs RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE lfw_worker_heartbeats');
    await pool.query(
      `UPDATE lfw_control_state
       SET mode = 'local_primary',
           active_owner = 'local',
           failover_reason = NULL,
           failback_not_before = NULL,
           updated_at = now()
       WHERE id = 'default'`
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  it('enqueues, claims, and completes a job through real Postgres', async () => {
    const jobs = createJobs({ store: postgresStore(pool) });

    const enqueued = await jobs.enqueue('generate-preview', { fileId: 'file_123' });
    const claimed = await jobs.claimNext({
      workerId: 'office-mac-mini',
      leaseMs: 30_000,
    });
    const completed = await jobs.complete(claimed!.id);

    expect(enqueued.status).toBe('pending');
    expect(claimed?.id).toBe(enqueued.id);
    expect(claimed?.status).toBe('running');
    expect(completed.status).toBe('completed');
  });

  it('persists durable ownership and heartbeat state for claim gating', async () => {
    const control = postgresControlStore(pool);
    const baseStore = postgresStore(pool);
    const localJobs = createJobs({
      store: createGatedStore(baseStore, control, 'local'),
    });
    const backupJobs = createJobs({
      store: createGatedStore(baseStore, control, 'backup'),
    });

    const initial = await control.getState();
    await control.recordHeartbeat({
      platform: 'local',
      workerId: 'office-mac-mini',
    });
    await control.updateOwnership({
      mode: 'backup_active',
      activeOwner: 'backup',
      failoverReason: 'integration_drill',
      failbackNotBefore: null,
    });

    const enqueued = await localJobs.enqueue('generate-preview', { fileId: 'file_456' });
    const localClaim = await localJobs.claimNext({
      workerId: 'office-mac-mini',
      leaseMs: 30_000,
    });
    const backupClaim = await backupJobs.claimNext({
      workerId: 'railway-worker',
      leaseMs: 30_000,
    });
    const updated = await control.getState();

    expect(initial.activeOwner).toBe('local');
    expect(await control.allowClaims('local')).toBe(false);
    expect(await control.allowClaims('backup')).toBe(true);
    expect(localClaim).toBeNull();
    expect(backupClaim?.id).toBe(enqueued.id);
    expect(updated.mode).toBe('backup_active');
    expect(updated.failoverReason).toBe('integration_drill');
    expect(updated.localHeartbeat?.workerId).toBe('office-mac-mini');
  });
});
