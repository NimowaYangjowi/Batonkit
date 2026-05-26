export const JOB_STATUS_VALUES = [
  'pending',
  'running',
  'completed',
  'failed',
  'dead_letter',
] as const;

export type JobStatus = (typeof JOB_STATUS_VALUES)[number];

export interface JobRecord<Payload = unknown> {
  id: string;
  name: string;
  payload: Payload;
  status: JobStatus;
  runAt: Date;
  attempts: number;
  maxAttempts: number;
  leaseOwner: string | null;
  leaseExpiresAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnqueueOptions {
  id?: string;
  runAt?: Date;
  maxAttempts?: number;
}

export interface ClaimOptions {
  workerId: string;
  leaseMs: number;
  names?: string[];
}

export interface EnqueueInput {
  name: string;
  payload: unknown;
  options?: EnqueueOptions;
}

export interface JobStore {
  enqueue(input: EnqueueInput): Promise<JobRecord>;
  claimNext(options: ClaimOptions): Promise<JobRecord | null>;
  complete(id: string): Promise<JobRecord>;
  fail(id: string, error: string): Promise<JobRecord>;
  get(id: string): Promise<JobRecord | null>;
}

export interface JobsClient {
  enqueue: <Payload>(
    name: string,
    payload: Payload,
    options?: EnqueueOptions
  ) => Promise<JobRecord<Payload>>;
  claimNext: (options: ClaimOptions) => Promise<JobRecord | null>;
  complete: (id: string) => Promise<JobRecord>;
  fail: (id: string, error: string | Error) => Promise<JobRecord>;
  get: (id: string) => Promise<JobRecord | null>;
}

export interface CreateJobsOptions {
  store: JobStore;
}

export function createJobs(options: CreateJobsOptions): JobsClient {
  return {
    enqueue: async (name, payload, enqueueOptions) =>
      options.store.enqueue({ name, payload, options: enqueueOptions }) as Promise<
        JobRecord<typeof payload>
      >,
    claimNext: (claimOptions) => options.store.claimNext(claimOptions),
    complete: (id) => options.store.complete(id),
    fail: (id, error) =>
      options.store.fail(id, error instanceof Error ? error.message : error),
    get: (id) => options.store.get(id),
  };
}

export interface MemoryStoreOptions {
  now?: () => Date;
}

export interface MemoryJobStore extends JobStore {
  setNow: (value: Date) => void;
  list: () => JobRecord[];
}

export const WORKER_PLATFORM_VALUES = ['local', 'backup'] as const;
export const CONTROL_MODE_VALUES = [
  'local_primary',
  'backup_active',
  'maintenance_override',
] as const;

export type WorkerPlatform = (typeof WORKER_PLATFORM_VALUES)[number];
export type ControlMode = (typeof CONTROL_MODE_VALUES)[number];
export type WorkerHealthStatus = 'ok' | 'degraded' | 'stopping';

export interface WorkerHeartbeat {
  platform: WorkerPlatform;
  workerId: string;
  status: WorkerHealthStatus;
  observedAt: Date;
}

export interface RecordHeartbeatInput {
  platform: WorkerPlatform;
  workerId: string;
  status?: WorkerHealthStatus;
  observedAt?: Date;
}

export interface ControlState {
  mode: ControlMode;
  activeOwner: WorkerPlatform;
  failoverReason: string | null;
  failbackNotBefore: Date | null;
  localHeartbeat: WorkerHeartbeat | null;
  backupHeartbeat: WorkerHeartbeat | null;
  updatedAt: Date;
}

export interface UpdateOwnershipInput {
  mode: ControlMode;
  activeOwner: WorkerPlatform;
  failoverReason?: string | null;
  failbackNotBefore?: Date | null;
}

export interface ControlStore {
  getState: () => Promise<ControlState>;
  updateOwnership: (input: UpdateOwnershipInput) => Promise<ControlState>;
  recordHeartbeat: (input: RecordHeartbeatInput) => Promise<ControlState>;
  allowClaims: (platform: WorkerPlatform) => Promise<boolean>;
}

function cloneHeartbeat(heartbeat: WorkerHeartbeat | null): WorkerHeartbeat | null {
  return heartbeat
    ? {
        ...heartbeat,
        observedAt: new Date(heartbeat.observedAt),
      }
    : null;
}

function cloneControlState(state: ControlState): ControlState {
  return {
    ...state,
    failbackNotBefore: state.failbackNotBefore
      ? new Date(state.failbackNotBefore)
      : null,
    localHeartbeat: cloneHeartbeat(state.localHeartbeat),
    backupHeartbeat: cloneHeartbeat(state.backupHeartbeat),
    updatedAt: new Date(state.updatedAt),
  };
}

function cloneJob(job: JobRecord): JobRecord {
  return {
    ...job,
    runAt: new Date(job.runAt),
    leaseExpiresAt: job.leaseExpiresAt ? new Date(job.leaseExpiresAt) : null,
    createdAt: new Date(job.createdAt),
    updatedAt: new Date(job.updatedAt),
  };
}

function createJobId(): string {
  return `job_${crypto.randomUUID()}`;
}

export function createMemoryStore(options: MemoryStoreOptions = {}): MemoryJobStore {
  let now = options.now ?? (() => new Date());
  const jobs = new Map<string, JobRecord>();

  function currentTime(): Date {
    return new Date(now());
  }

  function getMutableJob(id: string): JobRecord {
    const job = jobs.get(id);
    if (!job) {
      throw new Error(`Job not found: ${id}`);
    }
    return job;
  }

  return {
    setNow(value) {
      now = () => new Date(value);
    },

    list() {
      return [...jobs.values()].map(cloneJob);
    },

    async enqueue(input) {
      const timestamp = currentTime();
      const jobId = input.options?.id ?? createJobId();
      if (jobs.has(jobId)) {
        throw new Error(`Job already exists: ${jobId}`);
      }
      const job: JobRecord = {
        id: jobId,
        name: input.name,
        payload: input.payload,
        status: 'pending',
        runAt: input.options?.runAt ?? timestamp,
        attempts: 0,
        maxAttempts: input.options?.maxAttempts ?? 3,
        leaseOwner: null,
        leaseExpiresAt: null,
        lastError: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      jobs.set(job.id, job);
      return cloneJob(job);
    },

    async claimNext(options) {
      const timestamp = currentTime();
      const candidate = [...jobs.values()]
        .filter((job) => !options.names || options.names.includes(job.name))
        .filter((job) => job.runAt.getTime() <= timestamp.getTime())
        .filter((job) => {
          if (job.status === 'pending' || job.status === 'failed') {
            return true;
          }
          return (
            job.status === 'running' &&
            job.leaseExpiresAt !== null &&
            job.leaseExpiresAt.getTime() <= timestamp.getTime()
          );
        })
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())[0];

      if (!candidate) {
        return null;
      }

      candidate.status = 'running';
      candidate.attempts += 1;
      candidate.leaseOwner = options.workerId;
      candidate.leaseExpiresAt = new Date(timestamp.getTime() + options.leaseMs);
      candidate.updatedAt = timestamp;
      return cloneJob(candidate);
    },

    async complete(id) {
      const timestamp = currentTime();
      const job = getMutableJob(id);
      job.status = 'completed';
      job.leaseOwner = null;
      job.leaseExpiresAt = null;
      job.updatedAt = timestamp;
      return cloneJob(job);
    },

    async fail(id, error) {
      const timestamp = currentTime();
      const job = getMutableJob(id);
      job.status = job.attempts >= job.maxAttempts ? 'dead_letter' : 'failed';
      job.lastError = error;
      job.leaseOwner = null;
      job.leaseExpiresAt = null;
      job.updatedAt = timestamp;
      return cloneJob(job);
    },

    async get(id) {
      const job = jobs.get(id);
      return job ? cloneJob(job) : null;
    },
  };
}

export function createMemoryControlStore(options: { now?: () => Date } = {}): ControlStore {
  const now = options.now ?? (() => new Date());
  let state: ControlState = {
    mode: 'local_primary',
    activeOwner: 'local',
    failoverReason: null,
    failbackNotBefore: null,
    localHeartbeat: null,
    backupHeartbeat: null,
    updatedAt: new Date(now()),
  };

  return {
    async getState() {
      return cloneControlState(state);
    },

    async updateOwnership(input) {
      state = {
        ...state,
        mode: input.mode,
        activeOwner: input.activeOwner,
        failoverReason: input.failoverReason ?? null,
        failbackNotBefore: input.failbackNotBefore ?? null,
        updatedAt: new Date(now()),
      };
      return cloneControlState(state);
    },

    async recordHeartbeat(input) {
      const heartbeat: WorkerHeartbeat = {
        platform: input.platform,
        workerId: input.workerId,
        status: input.status ?? 'ok',
        observedAt: input.observedAt ?? new Date(now()),
      };
      state = {
        ...state,
        localHeartbeat: input.platform === 'local' ? heartbeat : state.localHeartbeat,
        backupHeartbeat: input.platform === 'backup' ? heartbeat : state.backupHeartbeat,
        updatedAt: new Date(now()),
      };
      return cloneControlState(state);
    },

    async allowClaims(platform) {
      return state.activeOwner === platform;
    },
  };
}

export function createGatedStore(
  store: JobStore,
  control: ControlStore,
  platform: WorkerPlatform
): JobStore {
  return {
    enqueue: (input) => store.enqueue(input),
    complete: (id) => store.complete(id),
    fail: (id, error) => store.fail(id, error),
    get: (id) => store.get(id),
    async claimNext(options) {
      if (!(await control.allowClaims(platform))) {
        return null;
      }
      return store.claimNext(options);
    },
  };
}

export interface BackupProvider {
  wake: () => Promise<void>;
  park: () => Promise<void>;
}

export type FailoverMonitorEvent = 'down' | 'up';

export type FailoverAction =
  | 'failed_over'
  | 'failback_cooldown'
  | 'restored_local'
  | 'noop';

export interface ApplyFailoverEventInput {
  control: ControlStore;
  provider: BackupProvider;
  event: FailoverMonitorEvent;
  reason?: string;
  observedAt?: Date;
  failbackCooldownMs: number;
}

export interface ApplyFailoverEventResult {
  action: FailoverAction;
  state: ControlState;
}

export interface ReconcileFailbackInput {
  control: ControlStore;
  provider: BackupProvider;
  observedAt?: Date;
}

export async function applyFailoverEvent(
  input: ApplyFailoverEventInput
): Promise<ApplyFailoverEventResult> {
  const current = await input.control.getState();
  const observedAt = input.observedAt ?? new Date();

  if (current.mode === 'maintenance_override') {
    return { action: 'noop', state: current };
  }

  if (input.event === 'down') {
    if (current.activeOwner === 'backup') {
      return { action: 'noop', state: current };
    }

    const nextState = await input.control.updateOwnership({
      mode: 'backup_active',
      activeOwner: 'backup',
      failoverReason: input.reason ?? 'local_down',
      failbackNotBefore: null,
    });

    try {
      await input.provider.wake();
    } catch (error) {
      await input.control.updateOwnership({
        mode: 'local_primary',
        activeOwner: 'local',
        failoverReason: null,
        failbackNotBefore: null,
      });
      throw error;
    }

    return { action: 'failed_over', state: nextState };
  }

  if (current.activeOwner === 'local' && current.failbackNotBefore === null) {
    return { action: 'noop', state: current };
  }

  if (input.failbackCooldownMs <= 0) {
    const restored = await input.control.updateOwnership({
      mode: 'local_primary',
      activeOwner: 'local',
      failoverReason: null,
      failbackNotBefore: null,
    });
    await input.provider.park();
    return { action: 'restored_local', state: restored };
  }

  if (!current.failbackNotBefore) {
    const nextState = await input.control.updateOwnership({
      mode: 'backup_active',
      activeOwner: 'backup',
      failoverReason: current.failoverReason,
      failbackNotBefore: new Date(observedAt.getTime() + input.failbackCooldownMs),
    });
    return { action: 'failback_cooldown', state: nextState };
  }

  if (observedAt.getTime() < current.failbackNotBefore.getTime()) {
    return { action: 'failback_cooldown', state: current };
  }

  const restored = await input.control.updateOwnership({
    mode: 'local_primary',
    activeOwner: 'local',
    failoverReason: null,
    failbackNotBefore: null,
  });
  await input.provider.park();
  return { action: 'restored_local', state: restored };
}

export async function reconcileFailback(
  input: ReconcileFailbackInput
): Promise<ApplyFailoverEventResult> {
  const current = await input.control.getState();
  const observedAt = input.observedAt ?? new Date();

  if (current.mode === 'maintenance_override') {
    return { action: 'noop', state: current };
  }

  if (current.activeOwner === 'local' || !current.failbackNotBefore) {
    return { action: 'noop', state: current };
  }

  if (observedAt.getTime() < current.failbackNotBefore.getTime()) {
    return { action: 'failback_cooldown', state: current };
  }

  const restored = await input.control.updateOwnership({
    mode: 'local_primary',
    activeOwner: 'local',
    failoverReason: null,
    failbackNotBefore: null,
  });
  await input.provider.park();
  return { action: 'restored_local', state: restored };
}
