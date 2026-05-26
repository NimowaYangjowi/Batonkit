import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createJobs,
  createMemoryControlStore,
  createMemoryStore,
  type RecordHeartbeatInput,
} from '@batonkit/core';

import { createWorker, defineJob } from './index.js';

describe('worker runtime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('registers a job definition', () => {
    const job = defineJob('generate-preview', async () => undefined);

    expect(job.name).toBe('generate-preview');
  });

  it('runs a claimed job and marks it completed', async () => {
    const store = createMemoryStore();
    const jobs = createJobs({ store });
    await jobs.enqueue('generate-preview', { fileId: 'file_123' });
    const handled: unknown[] = [];

    const worker = createWorker({
      store,
      workerId: 'local-worker',
      jobs: [
        defineJob('generate-preview', async (payload) => {
          handled.push(payload);
        }),
      ],
    });

    const result = await worker.runOnce();
    const [job] = store.list();

    expect(result).toBe('processed');
    expect(handled).toEqual([{ fileId: 'file_123' }]);
    expect(job?.status).toBe('completed');
  });

  it('does not claim jobs outside its registered names', async () => {
    const store = createMemoryStore();
    const jobs = createJobs({ store });
    await jobs.enqueue('send-report', { reportId: 'report_123' });

    const worker = createWorker({
      store,
      workerId: 'local-worker',
      jobs: [defineJob('generate-preview', async () => undefined)],
    });

    const result = await worker.runOnce();
    const [job] = store.list();

    expect(result).toBe('idle');
    expect(job?.status).toBe('pending');
    expect(job?.attempts).toBe(0);
    expect(job?.lastError).toBeNull();
  });

  it('does not sweep the queue when no handlers are registered', async () => {
    const store = createMemoryStore();
    const jobs = createJobs({ store });
    await jobs.enqueue('send-report', { reportId: 'report_123' });

    const worker = createWorker({
      store,
      workerId: 'local-worker',
      jobs: [],
    });

    const result = await worker.runOnce();
    const [job] = store.list();

    expect(result).toBe('idle');
    expect(job?.status).toBe('pending');
    expect(job?.attempts).toBe(0);
  });

  it('stops without claiming more work', async () => {
    const store = createMemoryStore();
    const jobs = createJobs({ store });
    await jobs.enqueue('generate-preview', {});

    const worker = createWorker({
      store,
      workerId: 'local-worker',
      jobs: [defineJob('generate-preview', async () => undefined)],
    });

    await worker.stop();

    expect(await worker.runOnce()).toBe('stopped');
    expect(store.list()[0]?.status).toBe('pending');
  });

  it('processes a batch up to the configured concurrency', async () => {
    const store = createMemoryStore();
    const jobs = createJobs({ store });
    await jobs.enqueue('generate-preview', { index: 1 });
    await jobs.enqueue('generate-preview', { index: 2 });
    let active = 0;
    let maxActive = 0;

    const worker = createWorker({
      store,
      workerId: 'local-worker',
      concurrency: 2,
      jobs: [
        defineJob('generate-preview', async () => {
          active += 1;
          maxActive = Math.max(maxActive, active);
          await new Promise((resolve) => setTimeout(resolve, 10));
          active -= 1;
        }),
      ],
    });

    const result = await worker.runBatch();

    expect(result.processed).toBe(2);
    expect(maxActive).toBe(2);
  });

  it('records a heartbeat when the worker starts', async () => {
    const control = createMemoryControlStore();
    const worker = createWorker({
      store: createMemoryStore(),
      control,
      platform: 'local',
      workerId: 'local-worker',
      jobs: [],
      pollIntervalMs: 1,
    });

    await worker.start();
    const state = await control.getState();
    await worker.stop();

    expect(state.localHeartbeat?.workerId).toBe('local-worker');
    expect(state.localHeartbeat?.status).toBe('ok');
  });

  it('stops the heartbeat loop when the worker stops', async () => {
    vi.useFakeTimers();
    const baseControl = createMemoryControlStore();
    const heartbeats: RecordHeartbeatInput[] = [];
    const worker = createWorker({
      store: createMemoryStore(),
      control: {
        ...baseControl,
        recordHeartbeat: async (input) => {
          heartbeats.push(input);
          return baseControl.recordHeartbeat(input);
        },
      },
      platform: 'local',
      workerId: 'local-worker',
      jobs: [],
      heartbeatIntervalMs: 1_000,
      pollIntervalMs: 1_000,
    });

    await worker.start();
    await vi.advanceTimersByTimeAsync(1_000);
    const stopPromise = worker.stop();
    await vi.advanceTimersByTimeAsync(1_000);
    await stopPromise;
    const countAfterStop = heartbeats.length;

    await vi.advanceTimersByTimeAsync(3_000);

    expect(countAfterStop).toBeGreaterThanOrEqual(2);
    expect(heartbeats).toContainEqual(
      expect.objectContaining({
        platform: 'local',
        workerId: 'local-worker',
        status: 'ok',
      })
    );
    expect(heartbeats.length).toBe(countAfterStop);
  });

  it('logs heartbeat failures without blocking worker startup', async () => {
    const errors: Array<Record<string, unknown> | undefined> = [];
    const worker = createWorker({
      store: createMemoryStore(),
      control: {
        ...createMemoryControlStore(),
        recordHeartbeat: async () => {
          throw new Error('heartbeat failed');
        },
      },
      platform: 'local',
      workerId: 'local-worker',
      jobs: [],
      pollIntervalMs: 1,
      logger: {
        info: () => undefined,
        error: (_message, context) => {
          errors.push(context);
        },
      },
    });

    await worker.start();
    await worker.stop();

    expect(errors[0]).toMatchObject({
      workerId: 'local-worker',
      platform: 'local',
      error: 'heartbeat failed',
    });
  });
});
