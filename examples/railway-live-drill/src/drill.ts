import { pathToFileURL } from 'node:url';

import { applyFailoverEvent, createJobs, type BackupProvider } from '@batonkit/core';
import { postgresControlStore, postgresStore } from '@batonkit/postgres';
import { railwayProvider } from '@batonkit/provider-railway';
import pg from 'pg';

import { readDrillConfig } from './config.js';
import {
  createDrillWorkerRuntime,
  migrateDrillSchema,
  resetDrillState,
} from './worker.js';

const { Pool } = pg;

function createBackupProvider(
  readyUrl: string | null,
  controlSecret: string
): BackupProvider {
  if (!readyUrl) {
    return {
      wake: async () => undefined,
      park: async () => undefined,
    };
  }

  return railwayProvider({
    readyUrl,
    refreshSecret: controlSecret,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function expectRunOnceProcessed(
  label: 'local' | 'backup',
  runOnce: () => Promise<'processed' | 'idle' | 'stopped'>
): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await runOnce();
    if (result === 'processed') {
      return;
    }

    if (result === 'stopped') {
      throw new Error(`${label} worker stopped before processing the drill job.`);
    }

    await sleep(50);
  }

  throw new Error(`${label} worker never processed the queued drill job.`);
}

async function expectRunOnceIdle(
  label: 'local' | 'backup',
  runOnce: () => Promise<'processed' | 'idle' | 'stopped'>
): Promise<void> {
  const result = await runOnce();
  if (result !== 'idle') {
    throw new Error(`${label} worker processed work when ownership should have blocked it.`);
  }
}

async function runLocalDrill(): Promise<void> {
  const config = readDrillConfig();
  const localRuntime = await createDrillWorkerRuntime({
    ...config,
    platform: 'local',
    workerId: 'local-drill-worker',
  });
  const backupRuntime = await createDrillWorkerRuntime({
    ...config,
    platform: 'backup',
    workerId: 'backup-drill-worker',
  });
  const provider = createBackupProvider(null, config.controlSecret);

  try {
    await migrateDrillSchema(localRuntime.client);
    await resetDrillState(localRuntime.client);

    const jobA = await localRuntime.jobs.enqueue('generate-preview', {
      fileId: 'drill-job-a',
      screenLabel: 'Drill job A',
    });
    await expectRunOnceProcessed('local', () => localRuntime.runOnce());

    const failedOver = await applyFailoverEvent({
      control: localRuntime.control,
      provider,
      event: 'down',
      reason: 'drill_local_down',
      failbackCooldownMs: config.failbackCooldownMs,
    });

    const jobB = await localRuntime.jobs.enqueue('generate-preview', {
      fileId: 'drill-job-b',
      screenLabel: 'Drill job B',
    });
    await expectRunOnceIdle('local', () => localRuntime.runOnce());
    await expectRunOnceProcessed('backup', () => backupRuntime.runOnce());

    const failbackAttempt = await applyFailoverEvent({
      control: localRuntime.control,
      provider,
      event: 'up',
      reason: 'drill_local_up',
      failbackCooldownMs: config.failbackCooldownMs,
    });
    const restored =
      failbackAttempt.action === 'failback_cooldown'
        ? await applyFailoverEvent({
            control: localRuntime.control,
            provider,
            event: 'up',
            reason: 'drill_local_up_after_cooldown',
            observedAt: new Date(Date.now() + config.failbackCooldownMs + 1),
            failbackCooldownMs: config.failbackCooldownMs,
          })
        : failbackAttempt;

    const jobC = await localRuntime.jobs.enqueue('generate-preview', {
      fileId: 'drill-job-c',
      screenLabel: 'Drill job C',
    });
    await expectRunOnceIdle('backup', () => backupRuntime.runOnce());
    await expectRunOnceProcessed('local', () => localRuntime.runOnce());

    console.info(
      JSON.stringify(
        {
          ok: true,
          jobIds: [jobA.id, jobB.id, jobC.id],
          failedOver: failedOver.action,
          restored: restored.action,
          finalOwner: (await localRuntime.control.getState()).activeOwner,
        },
        null,
        2
      )
    );
  } finally {
    await backupRuntime.close();
    await localRuntime.close();
  }
}

async function enqueueSingleJob(label: string): Promise<void> {
  const config = readDrillConfig();
  const pool = new Pool({ connectionString: config.databaseUrl });
  const jobs = createJobs({ store: postgresStore(pool) });

  try {
    await migrateDrillSchema(pool);
    const job = await jobs.enqueue('generate-preview', {
      fileId: label,
      screenLabel: label,
    });
    console.info(JSON.stringify({ ok: true, jobId: job.id }, null, 2));
  } finally {
    await pool.end();
  }
}

async function printState(): Promise<void> {
  const config = readDrillConfig();
  const pool = new Pool({ connectionString: config.databaseUrl });

  try {
    await migrateDrillSchema(pool);
    console.info(
      JSON.stringify(await postgresControlStore(pool).getState(), null, 2)
    );
  } finally {
    await pool.end();
  }
}

async function applyManualFailover(event: 'down' | 'up'): Promise<void> {
  const config = readDrillConfig();
  const pool = new Pool({ connectionString: config.databaseUrl });
  const control = postgresControlStore(pool);
  const provider = createBackupProvider(config.readyUrl, config.controlSecret);

  try {
    await migrateDrillSchema(pool);
    const result = await applyFailoverEvent({
      control,
      provider,
      event,
      reason: event === 'down' ? 'manual_live_drill_down' : 'manual_live_drill_up',
      failbackCooldownMs: config.failbackCooldownMs,
    });
    console.info(JSON.stringify(result, null, 2));
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const command = process.argv[2] ?? 'run-local';

  if (command === 'run-local') {
    await runLocalDrill();
    return;
  }

  if (command === 'enqueue') {
    await enqueueSingleJob(process.argv[3] ?? 'manual-drill-job');
    return;
  }

  if (command === 'state') {
    await printState();
    return;
  }

  if (command === 'failover') {
    const event = process.argv[3];
    if (event !== 'down' && event !== 'up') {
      throw new Error('Usage: node dist/drill.js failover <down|up>');
    }

    await applyManualFailover(event);
    return;
  }

  throw new Error(`Unknown drill command: ${command}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
