import { pathToFileURL } from 'node:url';

import {
  createGatedStore,
  createJobs,
  type ControlStore,
  type ControlState,
  type RecordHeartbeatInput,
  type WorkerHealthStatus,
  type WorkerPlatform,
} from '@batonkit/core';
import {
  createControlPlaneMigrationSql,
  createQueueMigrationSql,
  postgresControlStore,
  postgresStore,
  type QueryClient,
} from '@batonkit/postgres';
import { createWorker, defineJob, type RunOnceResult } from '@batonkit/worker';
import pg from 'pg';

import { readDrillConfig, type DrillConfig } from './config.js';

const { Pool } = pg;

export interface DrillWorkerRuntime {
  client: QueryClient;
  close: () => Promise<void>;
  control: ReturnType<typeof postgresControlStore>;
  jobs: ReturnType<typeof createJobs>;
  platform: WorkerPlatform;
  recordHeartbeat: () => Promise<ControlState>;
  runOnce: () => Promise<RunOnceResult>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  workerId: string;
}

export function createHeartbeatStatusMirror(control: ControlStore): {
  control: ControlStore;
  getStatus: () => WorkerHealthStatus;
} {
  let currentStatus: WorkerHealthStatus = 'ok';

  return {
    control: {
      ...control,
      recordHeartbeat(input: RecordHeartbeatInput): Promise<ControlState> {
        currentStatus = input.status ?? 'ok';
        return control.recordHeartbeat(input);
      },
    },
    getStatus: () => currentStatus,
  };
}

function createConsoleLogger(platform: WorkerPlatform, workerId: string) {
  return {
    info(message: string, context?: Record<string, unknown>) {
      console.info(`[${platform}:${workerId}] ${message}`, context ?? {});
    },
    error(message: string, context?: Record<string, unknown>) {
      console.error(`[${platform}:${workerId}] ${message}`, context ?? {});
    },
  };
}

export async function migrateDrillSchema(client: QueryClient): Promise<void> {
  await client.query(createQueueMigrationSql());
  await client.query(createControlPlaneMigrationSql());
}

export async function resetDrillState(client: QueryClient): Promise<void> {
  await client.query('TRUNCATE lfw_job_events, lfw_jobs RESTART IDENTITY CASCADE');
  await client.query('TRUNCATE lfw_worker_heartbeats');
  await client.query(
    `UPDATE lfw_control_state
     SET mode = 'local_primary',
         active_owner = 'local',
         failover_reason = NULL,
         failback_not_before = NULL,
         updated_at = now()
     WHERE id = 'default'`
  );
}

export async function createDrillWorkerRuntime(
  config: DrillConfig
): Promise<DrillWorkerRuntime> {
  const pool = new Pool({ connectionString: config.databaseUrl });
  const control = postgresControlStore(pool);
  const jobs = createJobs({ store: postgresStore(pool) });
  const store = createGatedStore(postgresStore(pool), control, config.platform);
  const heartbeatMirror = createHeartbeatStatusMirror(control);
  const worker = createWorker({
    store,
    control: heartbeatMirror.control,
    platform: config.platform,
    workerId: config.workerId,
    jobs: [
      defineJob('generate-preview', async (payload, context) => {
        context.logger.info('Processed drill job', {
          jobId: context.job.id,
          payload,
          visibleTask: 'generate-preview',
        });
      }),
    ],
    heartbeatIntervalMs: 5_000,
    pollIntervalMs: 250,
    logger: createConsoleLogger(config.platform, config.workerId),
  });
  let started = false;

  async function recordHeartbeat(): Promise<ControlState> {
    return control.recordHeartbeat({
      platform: config.platform,
      workerId: config.workerId,
      status: heartbeatMirror.getStatus(),
    });
  }

  async function stop(): Promise<void> {
    started = false;
    await worker.stop();
  }

  async function close(): Promise<void> {
    await stop();
    await pool.end();
  }

  return {
    client: pool,
    control,
    jobs,
    platform: config.platform,
    workerId: config.workerId,

    recordHeartbeat,

    async runOnce() {
      await recordHeartbeat();
      return worker.runOnce();
    },

    async start() {
      if (started) {
        return;
      }

      started = true;
      await worker.start();
    },

    stop,
    close,
  };
}

function waitForShutdownSignal(): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;

    const finish = () => {
      if (resolved) {
        return;
      }

      resolved = true;
      resolve();
    };

    process.once('SIGINT', finish);
    process.once('SIGTERM', finish);
  });
}

async function main(): Promise<void> {
  const config = readDrillConfig();
  const runtime = await createDrillWorkerRuntime(config);

  try {
    await migrateDrillSchema(runtime.client);
    await runtime.start();
    console.info(
      `BatonKit ${config.platform} drill worker is running as "${config.workerId}".`
    );
    await waitForShutdownSignal();
  } finally {
    await runtime.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
