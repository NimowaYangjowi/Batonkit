import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(new URL('..', import.meta.url).pathname);
const packages = [
  'core',
  'postgres',
  'worker',
  'next',
  'provider-railway',
  'monitor-webhook',
];

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? root,
      stdio: options.stdio ?? 'pipe',
      env: { ...process.env, ...options.env },
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolveRun({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed with ${code}\n${stderr || stdout}`));
    });
  });
}

const tmp = await mkdtemp(join(tmpdir(), 'batonkit-pack-'));

try {
  await run('npm', ['run', 'build'], { stdio: 'inherit' });

  const tarballs = [];
  for (const packageName of packages) {
    const packageDir = join(root, 'packages', packageName);
    const { stdout } = await run('npm', ['pack', '--json', '--pack-destination', tmp], {
      cwd: packageDir,
    });
    const [packed] = JSON.parse(stdout);
    tarballs.push(join(tmp, packed.filename));
  }

  await writeFile(
    join(tmp, 'package.json'),
    JSON.stringify({ type: 'module', private: true }, null, 2)
  );
  await run('npm', ['install', ...tarballs], { cwd: tmp, stdio: 'inherit' });
  await writeFile(
    join(tmp, 'consumer.mjs'),
    `
import { createJobs, createMemoryStore } from '@batonkit/core';
import { createQueueMigrationSql } from '@batonkit/postgres';
import { createWorker, defineJob } from '@batonkit/worker';
import { createControlPlaneHandlers } from '@batonkit/next';
import { railwayProvider } from '@batonkit/provider-railway';
import { parseMonitorWebhookEvent } from '@batonkit/monitor-webhook';

const store = createMemoryStore();
const jobs = createJobs({ store });
await jobs.enqueue('generate-preview', { fileId: 'file_123' });
const worker = createWorker({
  store,
  workerId: 'consumer-worker',
  jobs: [defineJob('generate-preview', async () => undefined)],
});
await worker.runOnce();

if (!createQueueMigrationSql().includes('lfw_jobs')) throw new Error('missing migration');
if (!createControlPlaneHandlers) throw new Error('missing next handlers');
if (!railwayProvider) throw new Error('missing railway provider');
if (parseMonitorWebhookEvent({ status: 'down' }).event !== 'down') {
  throw new Error('monitor parser failed');
}
`
  );
  await run('node', ['consumer.mjs'], { cwd: tmp, stdio: 'inherit' });

  const installed = JSON.parse(await readFile(join(tmp, 'package.json'), 'utf8'));
  if (!installed.dependencies?.['@batonkit/core']) {
    throw new Error('Consumer package did not install @batonkit/core');
  }
} finally {
  await rm(tmp, { recursive: true, force: true });
}

