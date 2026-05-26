import {
  createGatedStore,
  createJobs,
  createMemoryControlStore,
  createMemoryStore,
} from '@batonkit/core';

export const control = createMemoryControlStore();
const baseStore = createMemoryStore();

export const localStore = createGatedStore(baseStore, control, 'local');
export const backupStore = createGatedStore(baseStore, control, 'backup');
export const jobs = createJobs({ store: localStore });

