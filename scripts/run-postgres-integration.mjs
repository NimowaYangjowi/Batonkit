import { spawn } from 'node:child_process';

const containerName = `batonkit-postgres-test-${process.pid}`;
const port = 55432;
const databaseUrl = `postgres://postgres:postgres@127.0.0.1:${port}/postgres`;

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed with ${code}\n${stderr || stdout}`));
    });
  });
}

async function waitForPostgres() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      await run('docker', [
        'exec',
        containerName,
        'pg_isready',
        '-U',
        'postgres',
      ]);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error('Postgres test container did not become ready in time');
}

try {
  await run('docker', [
    'run',
    '--rm',
    '-d',
    '--name',
    containerName,
    '-e',
    'POSTGRES_PASSWORD=postgres',
    '-p',
    `127.0.0.1:${port}:5432`,
    'postgres:16-alpine',
  ]);
  await waitForPostgres();
  await run('npx', ['vitest', 'run', 'packages/postgres/src/integration.test.ts'], {
    stdio: 'inherit',
    env: {
      BATONKIT_TEST_DATABASE_URL: databaseUrl,
    },
  });
} finally {
  await run('docker', ['rm', '-f', containerName]).catch(() => undefined);
}

