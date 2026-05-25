import { describe, expect, it } from 'vitest';

import {
  createControlPlaneMigrationSql,
  createQueueMigrationSql,
  postgresStore,
} from './index.js';

describe('postgres queue package', () => {
  it('generates migration SQL for queue tables', () => {
    const sql = createQueueMigrationSql();

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS lfw_jobs');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS lfw_job_events');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS lfw_jobs_claim_idx');
  });

  it('generates migration SQL for control-plane tables', () => {
    const sql = createControlPlaneMigrationSql();

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS lfw_control_state');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS lfw_worker_heartbeats');
  });

  it('enqueues jobs through a query client', async () => {
    const queries: Array<{ text: string; values: unknown[] }> = [];
    const store = postgresStore({
      query: async (text: string, values: unknown[] = []) => {
        queries.push({ text, values });
        return {
          rows: [
            {
              id: 'job_1',
              name: 'generate-preview',
              payload: { fileId: 'file_123' },
              status: 'pending',
              run_at: new Date('2026-05-25T00:00:00.000Z'),
              attempts: 0,
              max_attempts: 3,
              lease_owner: null,
              lease_expires_at: null,
              last_error: null,
              created_at: new Date('2026-05-25T00:00:00.000Z'),
              updated_at: new Date('2026-05-25T00:00:00.000Z'),
            },
          ],
        };
      },
    });

    const job = await store.enqueue({
      name: 'generate-preview',
      payload: { fileId: 'file_123' },
    });

    expect(job.id).toBe('job_1');
    expect(queries[0]?.text).toContain('INSERT INTO lfw_jobs');
    expect(queries[0]?.values[0]).toBe('generate-preview');
  });
});
