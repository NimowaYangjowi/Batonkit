import { describe, expect, it } from 'vitest';

import { readDrillConfig } from './config.js';

describe('railway live drill config', () => {
  it('fails clearly when required env vars are missing', () => {
    expect(() => readDrillConfig({})).toThrow(
      'Missing required BatonKit env var: BATONKIT_CONTROL_SECRET'
    );
  });

  it('fails clearly for an invalid platform', () => {
    expect(() =>
      readDrillConfig({
        BATONKIT_CONTROL_SECRET: 'secret',
        BATONKIT_DATABASE_URL: 'postgres://example.test/db',
        BATONKIT_PLATFORM: 'desktop',
      })
    ).toThrow('Invalid BATONKIT_PLATFORM');
  });

  it('reads the live drill env with defaults', () => {
    const config = readDrillConfig({
      BATONKIT_CONTROL_SECRET: 'secret',
      BATONKIT_DATABASE_URL: 'postgres://example.test/db',
    });

    expect(config.platform).toBe('local');
    expect(config.port).toBe(3000);
    expect(config.workerId).toBe('local-drill-worker');
  });
});
