import { describe, expect, it } from 'vitest';

import {
  createMemoryControlStore,
  type ApplyFailoverEventInput,
  type JobRecord,
} from '@batonkit/core';
import type { QueryClient } from '@batonkit/postgres';

import {
  runLocalDrillWithConfig,
  runRemoteDrillWithConfig,
  type DrillSummary,
} from './drill.js';
import type { DrillConfig } from './config.js';

type RunOnceResult = 'processed' | 'idle' | 'stopped';

interface FakeRuntime {
  client: QueryClient;
  close: () => Promise<void>;
  control: ReturnType<typeof createMemoryControlStore>;
  jobs: {
    enqueue: <Payload>(
      name: string,
      payload: Payload,
      options?: unknown
    ) => Promise<JobRecord<Payload>>;
    claimNext: () => Promise<JobRecord | null>;
    complete: (id: string) => Promise<JobRecord>;
    fail: (id: string, error: string | Error) => Promise<JobRecord>;
    get: (id: string) => Promise<JobRecord | null>;
  };
  platform: 'local' | 'backup';
  runOnce: () => Promise<RunOnceResult>;
  workerId: string;
}

function createFakeQueryClient(label: string): QueryClient {
  return {
    async query() {
      throw new Error(`Unexpected query against fake client: ${label}`);
    },
  };
}

function createJobRecord<Payload>(
  id: string,
  name: string,
  payload: Payload,
  status: JobRecord['status'] = 'pending'
): JobRecord<Payload> {
  const timestamp = new Date('2026-05-27T00:00:00.000Z');

  return {
    id,
    name,
    payload,
    status,
    runAt: timestamp,
    attempts: 0,
    maxAttempts: 3,
    leaseOwner: null,
    leaseExpiresAt: null,
    lastError: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createBaseConfig(): DrillConfig {
  return {
    controlSecret: 'secret',
    databaseUrl: 'postgres://example.test/db',
    failbackCooldownMs: 0,
    platform: 'local',
    port: 3000,
    readyUrl: 'https://backup-worker.example.test/ready',
    workerId: 'ignored-by-test',
  };
}

function createFakeLocalDrillPair() {
  const control = createMemoryControlStore();
  let nextJobId = 1;
  const jobStatus = new Map<string, 'completed'>();
  let backupCanProcess = false;
  const localRunResults: RunOnceResult[] = ['processed', 'idle', 'processed'];

  const localRuntime: FakeRuntime = {
    client: createFakeQueryClient('local-client'),
    async close() {},
    control,
    jobs: {
      async enqueue(name, payload) {
        const id = `job_${nextJobId++}`;
        return createJobRecord(id, name, payload);
      },
      async claimNext() {
        return null;
      },
      async complete(id) {
        return createJobRecord(id, 'generate-preview', { fileId: id }, 'completed');
      },
      async fail(id, error) {
        return createJobRecord(
          id,
          'generate-preview',
          { error: error instanceof Error ? error.message : error },
          'failed'
        );
      },
      async get(id) {
        return jobStatus.has(id)
          ? createJobRecord(id, 'generate-preview', { fileId: id }, 'completed')
          : null;
      },
    },
    platform: 'local',
    async runOnce() {
      return localRunResults.shift() ?? 'idle';
    },
    workerId: 'local-drill-worker',
  };

  const backupRuntime: FakeRuntime = {
    client: createFakeQueryClient('backup-client'),
    async close() {},
    control,
    jobs: localRuntime.jobs,
    platform: 'backup',
    async runOnce() {
      return backupCanProcess ? 'processed' : 'idle';
    },
    workerId: 'backup-drill-worker',
  };

  return {
    localRuntime,
    backupRuntime,
    async applyEvent(input: ApplyFailoverEventInput) {
      if (input.event === 'down') {
        backupCanProcess = true;
      } else {
        backupCanProcess = false;
      }

      return input.event === 'down'
        ? {
            action: 'failed_over' as const,
            state: await control.updateOwnership({
              mode: 'backup_active',
              activeOwner: 'backup',
              failoverReason: input.reason ?? 'down',
              failbackNotBefore: null,
            }),
          }
        : {
            action: 'restored_local' as const,
            state: await control.updateOwnership({
              mode: 'local_primary',
              activeOwner: 'local',
              failoverReason: null,
              failbackNotBefore: null,
            }),
          };
    },
  };
}

function createFakeRemoteRuntime() {
  const control = createMemoryControlStore();
  let nextJobId = 1;
  const jobStatus = new Map<string, 'completed'>();
  let runOnceCalls = 0;

  const runtime: FakeRuntime = {
    client: createFakeQueryClient('remote-client'),
    async close() {},
    control,
    jobs: {
      async enqueue(name, payload) {
        const id = `job_${nextJobId++}`;
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'fileId' in payload &&
          payload.fileId === 'live-job-b'
        ) {
          jobStatus.set(id, 'completed');
        }
        return createJobRecord(id, name, payload);
      },
      async claimNext() {
        return null;
      },
      async complete(id) {
        return createJobRecord(id, 'generate-preview', { fileId: id }, 'completed');
      },
      async fail(id, error) {
        return createJobRecord(
          id,
          'generate-preview',
          { error: error instanceof Error ? error.message : error },
          'failed'
        );
      },
      async get(id) {
        return jobStatus.has(id)
          ? createJobRecord(id, 'generate-preview', { fileId: id }, 'completed')
          : null;
      },
    },
    platform: 'local',
    async runOnce() {
      runOnceCalls += 1;
      return runOnceCalls === 2 ? 'idle' : 'processed';
    },
    workerId: 'local-live-drill-worker',
  };

  return {
    runtime,
    async applyEvent(input: ApplyFailoverEventInput) {
      return input.event === 'down'
        ? {
            action: 'failed_over' as const,
            state: await control.updateOwnership({
              mode: 'backup_active',
              activeOwner: 'backup',
              failoverReason: input.reason ?? 'down',
              failbackNotBefore: null,
            }),
          }
        : {
            action: 'restored_local' as const,
            state: await control.updateOwnership({
              mode: 'local_primary',
              activeOwner: 'local',
              failoverReason: null,
              failbackNotBefore: null,
            }),
          };
    },
  };
}

describe('railway live drill orchestration', () => {
  it('proves the local practice field can hand the baton to the backup worker and back', async () => {
    const config = createBaseConfig();
    const { localRuntime, backupRuntime, applyEvent } = createFakeLocalDrillPair();
    const runtimes = [localRuntime, backupRuntime];

    const summary = await runLocalDrillWithConfig(config, {
      async createRuntime() {
        const runtime = runtimes.shift();
        if (!runtime) {
          throw new Error('No fake runtime left for the local drill test.');
        }
        return runtime;
      },
      applyEvent,
      createProvider() {
        return {
          wake: async () => undefined,
          park: async () => undefined,
        };
      },
      async migrateSchema() {},
      async resetState() {},
    });

    expect(summary).toEqual<DrillSummary>({
      mode: 'local',
      jobIds: ['job_1', 'job_2', 'job_3'],
      failedOver: 'failed_over',
      restored: 'restored_local',
      finalOwner: 'local',
    });
  });

  it('proves the remote practice field waits for the Railway backup worker to finish the middle job', async () => {
    const config = createBaseConfig();
    const { runtime, applyEvent } = createFakeRemoteRuntime();

    const summary = await runRemoteDrillWithConfig(config, {
      async createRuntime() {
        return runtime;
      },
      applyEvent,
      createProvider() {
        return {
          wake: async () => undefined,
          park: async () => undefined,
        };
      },
      async migrateSchema() {},
      async resetState() {},
    });

    expect(summary).toMatchObject({
      mode: 'remote',
      readyUrl: 'https://backup-worker.example.test/ready',
      initialOwner: 'local',
      ownerAfterDown: 'backup',
      ownerAfterUp: 'local',
      jobIds: ['job_1', 'job_2', 'job_3'],
      failedOver: 'failed_over',
      restored: 'restored_local',
      finalOwner: 'local',
    });
  });

  it('fails clearly when the remote drill is missing the backup worker ready URL', async () => {
    const config = {
      ...createBaseConfig(),
      readyUrl: null,
    };

    await expect(runRemoteDrillWithConfig(config)).rejects.toThrow(
      'BATONKIT_READY_URL is required for the remote Railway live drill.'
    );
  });
});
