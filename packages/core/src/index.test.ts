import { describe, expect, it } from 'vitest';

import { createJobs, createMemoryStore } from './index.js';

describe('job queue core', () => {
  it('enqueues a pending job with generic payload data', async () => {
    const jobs = createJobs({ store: createMemoryStore() });

    const job = await jobs.enqueue('generate-preview', { fileId: 'file_123' });

    expect(job.name).toBe('generate-preview');
    expect(job.payload).toEqual({ fileId: 'file_123' });
    expect(job.status).toBe('pending');
    expect(job.attempts).toBe(0);
  });

  it('lets only one worker claim a pending job lease', async () => {
    const jobs = createJobs({ store: createMemoryStore() });
    await jobs.enqueue('generate-preview', { fileId: 'file_123' });

    const firstClaim = await jobs.claimNext({
      workerId: 'local-worker',
      leaseMs: 30_000,
    });
    const secondClaim = await jobs.claimNext({
      workerId: 'backup-worker',
      leaseMs: 30_000,
    });

    expect(firstClaim?.leaseOwner).toBe('local-worker');
    expect(firstClaim?.status).toBe('running');
    expect(secondClaim).toBeNull();
  });

  it('reclaims a running job after its lease expires', async () => {
    const store = createMemoryStore({
      now: () => new Date('2026-05-25T00:00:00.000Z'),
    });
    const jobs = createJobs({ store });
    await jobs.enqueue('generate-preview', { fileId: 'file_123' });

    await jobs.claimNext({ workerId: 'local-worker', leaseMs: 1_000 });
    store.setNow(new Date('2026-05-25T00:00:02.000Z'));
    const reclaimed = await jobs.claimNext({
      workerId: 'backup-worker',
      leaseMs: 30_000,
    });

    expect(reclaimed?.leaseOwner).toBe('backup-worker');
    expect(reclaimed?.attempts).toBe(2);
  });

  it('moves a job to dead letter after retry attempts are exhausted', async () => {
    const jobs = createJobs({ store: createMemoryStore() });
    await jobs.enqueue('generate-preview', { fileId: 'file_123' }, { maxAttempts: 2 });

    const firstClaim = await jobs.claimNext({ workerId: 'local-worker', leaseMs: 30_000 });
    await jobs.fail(firstClaim!.id, 'first failure');

    const secondClaim = await jobs.claimNext({ workerId: 'local-worker', leaseMs: 30_000 });
    const failed = await jobs.fail(secondClaim!.id, 'second failure');

    expect(failed.status).toBe('dead_letter');
    expect(failed.lastError).toBe('second failure');
    expect(await jobs.claimNext({ workerId: 'local-worker', leaseMs: 30_000 })).toBeNull();
  });
});
