import type { WorkerPlatform } from '@batonkit/core';

export interface DrillConfig {
  controlSecret: string;
  databaseUrl: string;
  failbackCooldownMs: number;
  platform: WorkerPlatform;
  port: number;
  readyUrl: string | null;
  workerId: string;
}

export interface ReadDrillConfigOptions {
  defaultPlatform?: WorkerPlatform;
}

function requireEnv(name: string, value: string | undefined): string {
  if (value && value.trim().length > 0) {
    return value;
  }

  throw new Error(`Missing required BatonKit env var: ${name}`);
}

function parsePlatform(
  value: string | undefined,
  fallback: WorkerPlatform
): WorkerPlatform {
  const platform = value ?? fallback;
  if (platform === 'local' || platform === 'backup') {
    return platform;
  }

  throw new Error(
    `Invalid BATONKIT_PLATFORM: "${platform}". Expected "local" or "backup".`
  );
}

function parseNumber(value: string | undefined, fallback: number, name: string): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid ${name}: "${value}". Expected a non-negative number.`);
  }

  return parsed;
}

export function readDrillConfig(
  env: NodeJS.ProcessEnv = process.env,
  options: ReadDrillConfigOptions = {}
): DrillConfig {
  const platform = parsePlatform(
    env.BATONKIT_PLATFORM,
    options.defaultPlatform ?? 'local'
  );
  const port = parseNumber(env.BATONKIT_PORT, 3000, 'BATONKIT_PORT');
  const failbackCooldownMs = parseNumber(
    env.BATONKIT_FAILBACK_COOLDOWN_MS,
    0,
    'BATONKIT_FAILBACK_COOLDOWN_MS'
  );
  const workerId =
    env.BATONKIT_WORKER_ID?.trim() || `${platform === 'local' ? 'local' : 'backup'}-drill-worker`;

  return {
    controlSecret: requireEnv('BATONKIT_CONTROL_SECRET', env.BATONKIT_CONTROL_SECRET),
    databaseUrl: requireEnv('BATONKIT_DATABASE_URL', env.BATONKIT_DATABASE_URL),
    failbackCooldownMs,
    platform,
    port,
    readyUrl: env.BATONKIT_READY_URL?.trim() || null,
    workerId,
  };
}
