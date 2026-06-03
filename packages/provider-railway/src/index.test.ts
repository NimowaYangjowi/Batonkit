import { describe, expect, it } from 'vitest';

import { railwayProvider } from './index.js';

describe('railway provider', () => {
  it('wakes by polling ready URL and refreshing control plane', async () => {
    const calls: string[] = [];
    const provider = railwayProvider({
      readyUrl: 'https://backup.example.test/ready',
      refreshSecret: 'secret',
      fetch: async (url) => {
        calls.push(String(url));
        return new Response('{}', { status: 200 });
      },
    });

    await provider.wake();

    expect(calls).toEqual([
      'https://backup.example.test/ready',
      'https://backup.example.test/control-plane/refresh',
    ]);
  });

  it('parks by refreshing the standby control plane without claiming to suspend Railway', async () => {
    const calls: string[] = [];
    const provider = railwayProvider({
      readyUrl: 'https://backup.example.test/ready',
      refreshSecret: 'secret',
      fetch: async (url) => {
        calls.push(String(url));
        return new Response('{}', { status: 200 });
      },
    });

    await provider.park();

    expect(calls).toEqual([
      'https://backup.example.test/control-plane/refresh',
    ]);
  });
});
