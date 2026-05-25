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
      const job: JobRecord = {
        id: input.options?.id ?? createJobId(),
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
