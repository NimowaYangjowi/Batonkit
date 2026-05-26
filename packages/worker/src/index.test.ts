import { describe, expect, it } from 'vitest';

import { createJobs, createMemoryStore } from '@batonkit/core';

import { createWorker, defineJob } from './index.js';

describe('worker runtime', () => {
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

  it('fails unknown jobs clearly', async () => {
    const store = createMemoryStore();
    const jobs = createJobs({ store });
    await jobs.enqueue('missing-handler', {});

    const worker = createWorker({
      store,
      workerId: 'local-worker',
      jobs: [],
    });

    await worker.runOnce();
    const [job] = store.list();

    expect(job?.status).toBe('failed');
    expect(job?.lastError).toContain('No handler registered');
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
});
