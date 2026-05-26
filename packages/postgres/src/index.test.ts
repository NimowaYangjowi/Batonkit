import { describe, expect, it } from 'vitest';

import {
  createControlPlaneMigrationSql,
  createQueueMigrationSql,
  type QueryResult,
  postgresControlStore,
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

  it('reads and updates durable control-plane state through a query client', async () => {
    const queries: Array<{ text: string; values: unknown[] }> = [];
    const stateRow: {
      mode: string;
      active_owner: string;
      failover_reason: string | null;
      failback_not_before: Date | null;
      updated_at: Date;
    } = {
      mode: 'local_primary',
      active_owner: 'local',
      failover_reason: null,
      failback_not_before: null,
      updated_at: new Date('2026-05-26T00:00:00.000Z'),
    };
    const heartbeatRows: Array<{
      platform: string;
      worker_id: string;
      status: string;
      observed_at: Date;
    }> = [
      {
        platform: 'local',
        worker_id: 'office-mac-mini',
        status: 'ok',
        observed_at: new Date('2026-05-26T00:00:00.000Z'),
      },
    ];
    const control = postgresControlStore({
      query: async (text: string, values: unknown[] = []): Promise<QueryResult> => {
        queries.push({ text, values });

        if (text.includes('SELECT mode, active_owner')) {
          return { rows: [stateRow] };
        }

        if (text.includes('SELECT platform, worker_id')) {
          return { rows: heartbeatRows };
        }

        if (text.includes('UPDATE lfw_control_state')) {
          stateRow.mode = 'backup_active';
          stateRow.active_owner = 'backup';
          stateRow.failover_reason = 'monitor_down';
          stateRow.failback_not_before = new Date('2026-05-26T00:05:00.000Z');
          stateRow.updated_at = new Date('2026-05-26T00:01:00.000Z');
          return { rows: [stateRow] };
        }

        if (text.includes('INSERT INTO lfw_worker_heartbeats')) {
          const insertedHeartbeat = {
            platform: 'backup',
            worker_id: 'railway-worker',
            status: 'ok',
            observed_at: new Date('2026-05-26T00:02:00.000Z'),
          };
          heartbeatRows.push({
            ...insertedHeartbeat,
          });
          return { rows: [insertedHeartbeat] };
        }

        throw new Error(`Unexpected query: ${text}`);
      },
    });

    const initial = await control.getState();
    const updated = await control.updateOwnership({
      mode: 'backup_active',
      activeOwner: 'backup',
      failoverReason: 'monitor_down',
      failbackNotBefore: new Date('2026-05-26T00:05:00.000Z'),
    });
    const heartbeated = await control.recordHeartbeat({
      platform: 'backup',
      workerId: 'railway-worker',
    });

    expect(initial.activeOwner).toBe('local');
    expect(initial.localHeartbeat?.workerId).toBe('office-mac-mini');
    expect(updated.activeOwner).toBe('backup');
    expect(updated.failoverReason).toBe('monitor_down');
    expect(heartbeated.backupHeartbeat?.workerId).toBe('railway-worker');
    expect(await control.allowClaims('backup')).toBe(true);
    expect(await control.allowClaims('local')).toBe(false);
    expect(queries.some((query) => query.text.includes('UPDATE lfw_control_state'))).toBe(true);
    expect(
      queries.some((query) => query.text.includes('INSERT INTO lfw_worker_heartbeats'))
    ).toBe(true);
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
