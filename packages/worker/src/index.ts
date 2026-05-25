import type { JobRecord, JobStore } from '@local-first-worker/core';
import { createJobs } from '@local-first-worker/core';

export interface WorkerLogger {
  info: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

export interface JobContext {
  job: JobRecord;
  workerId: string;
  logger: WorkerLogger;
}

export type JobHandler<Payload = unknown> = (
  payload: Payload,
  context: JobContext
) => Promise<void> | void;

export interface JobDefinition<Payload = unknown> {
  name: string;
  handler: JobHandler<Payload>;
}

export interface CreateWorkerOptions {
  store: JobStore;
  workerId: string;
  jobs: JobDefinition[];
  leaseMs?: number;
  pollIntervalMs?: number;
  logger?: WorkerLogger;
}

export type RunOnceResult = 'processed' | 'idle' | 'stopped';

export interface WorkerRuntime {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  runOnce: () => Promise<RunOnceResult>;
}

const defaultLogger: WorkerLogger = {
  info: () => undefined,
  error: () => undefined,
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function defineJob<Payload = unknown>(
  name: string,
  handler: JobHandler<Payload>
): JobDefinition<Payload> {
  return { name, handler };
}

export function createWorker(options: CreateWorkerOptions): WorkerRuntime {
  const jobsClient = createJobs({ store: options.store });
  const handlers = new Map(options.jobs.map((job) => [job.name, job]));
  const leaseMs = options.leaseMs ?? 30_000;
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const logger = options.logger ?? defaultLogger;
  let isStopped = false;
  let loop: Promise<void> | null = null;

  async function runOnce(): Promise<RunOnceResult> {
    if (isStopped) {
      return 'stopped';
    }

    const job = await jobsClient.claimNext({
      workerId: options.workerId,
      leaseMs,
      names: [...handlers.keys()],
    });

    if (!job) {
      const unknownJob = await jobsClient.claimNext({
        workerId: options.workerId,
        leaseMs,
      });

      if (!unknownJob) {
        return 'idle';
      }

      await jobsClient.fail(unknownJob.id, `No handler registered for job "${unknownJob.name}"`);
      return 'processed';
    }

    const definition = handlers.get(job.name);
    if (!definition) {
      await jobsClient.fail(job.id, `No handler registered for job "${job.name}"`);
      return 'processed';
    }

    try {
      await definition.handler(job.payload, {
        job,
        workerId: options.workerId,
        logger,
      });
      await jobsClient.complete(job.id);
    } catch (error) {
      logger.error('Job handler failed', {
        jobId: job.id,
        name: job.name,
        error: errorMessage(error),
      });
      await jobsClient.fail(job.id, errorMessage(error));
    }

    return 'processed';
  }

  async function start(): Promise<void> {
    if (loop) {
      return;
    }

    isStopped = false;
    loop = (async () => {
      while (!isStopped) {
        const result = await runOnce();
        if (result === 'idle') {
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
      }
    })();
  }

  async function stop(): Promise<void> {
    isStopped = true;
    await loop;
    loop = null;
  }

  return {
    start,
    stop,
    runOnce,
  };
}
