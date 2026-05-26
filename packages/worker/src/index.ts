import type {
  ControlStore,
  JobRecord,
  JobStore,
  WorkerHealthStatus,
  WorkerPlatform,
} from '@batonkit/core';
import { createJobs } from '@batonkit/core';

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
  control?: ControlStore;
  platform?: WorkerPlatform;
  concurrency?: number;
  leaseMs?: number;
  pollIntervalMs?: number;
  heartbeatIntervalMs?: number;
  heartbeatStatus?: WorkerHealthStatus;
  logger?: WorkerLogger;
}

export type RunOnceResult = 'processed' | 'idle' | 'stopped';

export interface RunBatchResult {
  processed: number;
  idle: number;
  stopped: number;
}

export interface WorkerRuntime {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  runOnce: () => Promise<RunOnceResult>;
  runBatch: () => Promise<RunBatchResult>;
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
  const concurrency = Math.max(1, options.concurrency ?? 1);
  const leaseMs = options.leaseMs ?? 30_000;
  const pollIntervalMs = options.pollIntervalMs ?? 1_000;
  const heartbeatIntervalMs = Math.max(1, options.heartbeatIntervalMs ?? 30_000);
  const logger = options.logger ?? defaultLogger;
  const heartbeatEnabled = Boolean(options.control && options.platform);
  let isStopped = false;
  let loop: Promise<void> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  if ((options.control && !options.platform) || (!options.control && options.platform)) {
    throw new Error('Worker heartbeat requires both control and platform options');
  }

  async function recordHeartbeat(
    status: WorkerHealthStatus = options.heartbeatStatus ?? 'ok'
  ): Promise<void> {
    if (!heartbeatEnabled || !options.control || !options.platform) {
      return;
    }

    try {
      await options.control.recordHeartbeat({
        platform: options.platform,
        workerId: options.workerId,
        status,
      });
    } catch (error) {
      logger.error('Worker heartbeat failed', {
        workerId: options.workerId,
        platform: options.platform,
        error: errorMessage(error),
      });
    }
  }

  async function runOnce(): Promise<RunOnceResult> {
    if (isStopped) {
      return 'stopped';
    }

    if (handlers.size === 0) {
      return 'idle';
    }

    const job = await jobsClient.claimNext({
      workerId: options.workerId,
      leaseMs,
      names: [...handlers.keys()],
    });

    if (!job) {
      return 'idle';
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

  async function runBatch(): Promise<RunBatchResult> {
    const results = await Promise.all(
      Array.from({ length: concurrency }, () => runOnce())
    );

    return {
      processed: results.filter((result) => result === 'processed').length,
      idle: results.filter((result) => result === 'idle').length,
      stopped: results.filter((result) => result === 'stopped').length,
    };
  }

  async function start(): Promise<void> {
    if (loop) {
      return;
    }

    isStopped = false;
    await recordHeartbeat();
    if (heartbeatEnabled) {
      heartbeatTimer = setInterval(() => {
        void recordHeartbeat();
      }, heartbeatIntervalMs);
    }
    loop = (async () => {
      while (!isStopped) {
        const result = await runBatch();
        if (result.processed === 0) {
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
        }
      }
    })();
  }

  async function stop(): Promise<void> {
    const hadLoop = loop !== null;
    isStopped = true;
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    await loop;
    loop = null;
    if (hadLoop) {
      await recordHeartbeat('stopping');
    }
  }

  return {
    start,
    stop,
    runOnce,
    runBatch,
  };
}
