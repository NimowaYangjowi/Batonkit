import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';

import { createJobs } from '@batonkit/core';

import {
  createControlPlaneMigrationSql,
  createQueueMigrationSql,
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
});

