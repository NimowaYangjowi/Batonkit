import type { BackupProvider } from '@batonkit/core';

export interface RailwayProviderOptions {
  readyUrl: string;
  refreshSecret: string;
  fetch?: typeof fetch;
}

async function assertOk(response: Response, action: string): Promise<void> {
  if (!response.ok) {
    throw new Error(`Railway provider ${action} failed with ${response.status}`);
  }
}

export function railwayProvider(options: RailwayProviderOptions): BackupProvider {
  const fetchImpl = options.fetch ?? fetch;
  const refreshUrl = new URL('/control-plane/refresh', options.readyUrl).toString();

  async function refreshControlPlane(): Promise<void> {
    await assertOk(
      await fetchImpl(refreshUrl, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${options.refreshSecret}`,
        },
      }),
      'control refresh'
    );
  }

  return {
    async wake() {
      await assertOk(await fetchImpl(options.readyUrl), 'ready check');
      await refreshControlPlane();
    },

    async park() {
      // Railway cannot directly suspend a worker from inside BatonKit.
      // "park" keeps the standby control-plane door in sync instead.
      await refreshControlPlane();
    },
  };
}
