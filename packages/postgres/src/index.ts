import type {
  ClaimOptions,
  ControlState,
  ControlStore,
  EnqueueInput,
  JobRecord,
  JobStore,
  RecordHeartbeatInput,
  UpdateOwnershipInput,
  WorkerHeartbeat,
  WorkerPlatform,
} from '@batonkit/core';

export interface QueryResult<Row = Record<string, unknown>> {
  rows: Row[];
}

export interface QueryClient {
  query: (text: string, values?: unknown[]) => Promise<QueryResult>;
}

interface JobRow {
  id: string;
  name: string;
  payload: unknown;
  status: JobRecord['status'];
  run_at: Date | string;
  attempts: number;
  max_attempts: number;
  lease_owner: string | null;
  lease_expires_at: Date | string | null;
  last_error: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ControlStateRow {
  mode: ControlState['mode'];
  active_owner: ControlState['activeOwner'];
  failover_reason: string | null;
  failback_not_before: Date | string | null;
  updated_at: Date | string;
}

interface HeartbeatRow {
  platform: WorkerPlatform;
  worker_id: string;
  status: WorkerHeartbeat['status'];
  observed_at: Date | string;
}

function toDate(value: Date | string | null): Date | null {
  if (value === null) return null;
  return value instanceof Date ? value : new Date(value);
}

function toJobRecord(row: JobRow): JobRecord {
  return {
    id: row.id,
    name: row.name,
    payload: row.payload,
    status: row.status,
    runAt: toDate(row.run_at) ?? new Date(0),
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    leaseOwner: row.lease_owner,
    leaseExpiresAt: toDate(row.lease_expires_at),
    lastError: row.last_error,
    createdAt: toDate(row.created_at) ?? new Date(0),
    updatedAt: toDate(row.updated_at) ?? new Date(0),
  };
}

function firstRow(result: QueryResult<JobRow>, action: string): JobRecord {
  const row = result.rows[0];
  if (!row) {
    throw new Error(`Postgres queue ${action} did not return a job`);
  }
  return toJobRecord(row);
}

function asJobRows(result: QueryResult): QueryResult<JobRow> {
  return result as unknown as QueryResult<JobRow>;
}

function asControlRows(result: QueryResult): QueryResult<ControlStateRow> {
  return result as unknown as QueryResult<ControlStateRow>;
}

function asHeartbeatRows(result: QueryResult): QueryResult<HeartbeatRow> {
  return result as unknown as QueryResult<HeartbeatRow>;
}

function toHeartbeat(row: HeartbeatRow): WorkerHeartbeat {
  return {
    platform: row.platform,
    workerId: row.worker_id,
    status: row.status,
    observedAt: toDate(row.observed_at) ?? new Date(0),
  };
}

function toControlState(
  row: ControlStateRow,
  heartbeatRows: HeartbeatRow[]
): ControlState {
  const localHeartbeat = heartbeatRows.find((heartbeat) => heartbeat.platform === 'local');
  const backupHeartbeat = heartbeatRows.find((heartbeat) => heartbeat.platform === 'backup');

  return {
    mode: row.mode,
    activeOwner: row.active_owner,
    failoverReason: row.failover_reason,
    failbackNotBefore: toDate(row.failback_not_before),
    localHeartbeat: localHeartbeat ? toHeartbeat(localHeartbeat) : null,
    backupHeartbeat: backupHeartbeat ? toHeartbeat(backupHeartbeat) : null,
    updatedAt: toDate(row.updated_at) ?? new Date(0),
  };
}

async function getControlState(client: QueryClient): Promise<ControlState> {
  const [controlResult, heartbeatResult] = await Promise.all([
    client.query(
      `SELECT mode, active_owner, failover_reason, failback_not_before, updated_at
       FROM lfw_control_state
       WHERE id = 'default'`
    ),
    client.query(
      `SELECT platform, worker_id, status, observed_at
       FROM lfw_worker_heartbeats`
    ),
  ]);

  const controlRow = asControlRows(controlResult).rows[0];
  if (!controlRow) {
    throw new Error('Postgres control state row "default" is missing');
  }

  return toControlState(controlRow, asHeartbeatRows(heartbeatResult).rows);
}

export function createQueueMigrationSql(): string {
  return `
CREATE TABLE IF NOT EXISTS lfw_jobs (
  id text PRIMARY KEY DEFAULT ('job_' || gen_random_uuid()::text),
  name text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'dead_letter')),
  run_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  lease_owner text,
  lease_expires_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lfw_job_events (
  id bigserial PRIMARY KEY,
  job_id text NOT NULL REFERENCES lfw_jobs(id) ON DELETE CASCADE,
  event text NOT NULL,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lfw_jobs_claim_idx
  ON lfw_jobs (status, run_at, created_at)
  WHERE status IN ('pending', 'failed', 'running');
`;
}

export function createControlPlaneMigrationSql(): string {
  return `
CREATE TABLE IF NOT EXISTS lfw_control_state (
  id text PRIMARY KEY DEFAULT 'default',
  mode text NOT NULL,
  active_owner text NOT NULL,
  failover_reason text,
  failback_not_before timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lfw_worker_heartbeats (
  platform text PRIMARY KEY,
  worker_id text NOT NULL,
  status text NOT NULL,
  observed_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO lfw_control_state (id, mode, active_owner)
VALUES ('default', 'local_primary', 'local')
ON CONFLICT (id) DO NOTHING;
`;
}

export function postgresStore(client: QueryClient): JobStore {
  return {
    async enqueue(input: EnqueueInput) {
      const result = await client.query(
        `INSERT INTO lfw_jobs (id, name, payload, run_at, max_attempts)
         VALUES (COALESCE($1::text, 'job_' || gen_random_uuid()::text), $2, $3::jsonb, COALESCE($4::timestamptz, now()), COALESCE($5::integer, 3))
         RETURNING *`,
        [
          input.options?.id ?? null,
          input.name,
          JSON.stringify(input.payload),
          input.options?.runAt ?? null,
          input.options?.maxAttempts ?? null,
        ]
      );
      return firstRow(asJobRows(result), 'enqueue');
    },

    async claimNext(options: ClaimOptions) {
      const result = await client.query(
        `WITH candidate AS (
           SELECT id
           FROM lfw_jobs
           WHERE run_at <= now()
             AND (
               status IN ('pending', 'failed')
               OR (status = 'running' AND lease_expires_at <= now())
             )
             AND ($3::text[] IS NULL OR name = ANY($3::text[]))
           ORDER BY created_at ASC
           FOR UPDATE SKIP LOCKED
           LIMIT 1
         )
         UPDATE lfw_jobs
         SET status = 'running',
             attempts = attempts + 1,
             lease_owner = $1,
             lease_expires_at = now() + ($2::integer * interval '1 millisecond'),
             updated_at = now()
         FROM candidate
         WHERE lfw_jobs.id = candidate.id
         RETURNING lfw_jobs.*`,
        [options.workerId, options.leaseMs, options.names ?? null]
      );
      const row = asJobRows(result).rows[0];
      return row ? toJobRecord(row) : null;
    },

    async complete(id: string) {
      const result = await client.query(
        `UPDATE lfw_jobs
         SET status = 'completed',
             lease_owner = NULL,
             lease_expires_at = NULL,
             updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      return firstRow(asJobRows(result), 'complete');
    },

    async fail(id: string, error: string) {
      const result = await client.query(
        `UPDATE lfw_jobs
         SET status = CASE WHEN attempts >= max_attempts THEN 'dead_letter' ELSE 'failed' END,
             last_error = $2,
             lease_owner = NULL,
             lease_expires_at = NULL,
             updated_at = now()
         WHERE id = $1
         RETURNING *`,
        [id, error]
      );
      return firstRow(asJobRows(result), 'fail');
    },

    async get(id: string) {
      const result = await client.query('SELECT * FROM lfw_jobs WHERE id = $1', [id]);
      const row = asJobRows(result).rows[0];
      return row ? toJobRecord(row) : null;
    },
  };
}

export function postgresControlStore(client: QueryClient): ControlStore {
  return {
    getState: () => getControlState(client),

    async updateOwnership(input: UpdateOwnershipInput) {
      await client.query(
        `UPDATE lfw_control_state
         SET mode = $1,
             active_owner = $2,
             failover_reason = $3,
             failback_not_before = $4,
             updated_at = now()
         WHERE id = 'default'`,
        [
          input.mode,
          input.activeOwner,
          input.failoverReason ?? null,
          input.failbackNotBefore ?? null,
        ]
      );

      return getControlState(client);
    },

    async recordHeartbeat(input: RecordHeartbeatInput) {
      await client.query(
        `INSERT INTO lfw_worker_heartbeats (platform, worker_id, status, observed_at, updated_at)
         VALUES ($1, $2, $3, COALESCE($4::timestamptz, now()), now())
         ON CONFLICT (platform) DO UPDATE
         SET worker_id = EXCLUDED.worker_id,
             status = EXCLUDED.status,
             observed_at = EXCLUDED.observed_at,
             updated_at = now()`,
        [
          input.platform,
          input.workerId,
          input.status ?? 'ok',
          input.observedAt ?? null,
        ]
      );

      return getControlState(client);
    },

    async allowClaims(platform: WorkerPlatform) {
      const state = await getControlState(client);
      return state.activeOwner === platform;
    },
  };
}
