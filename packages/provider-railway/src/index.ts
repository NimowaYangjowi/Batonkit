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

  return {
    async wake() {
      await assertOk(await fetchImpl(options.readyUrl), 'ready check');
      await assertOk(
        await fetchImpl(refreshUrl, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${options.refreshSecret}`,
          },
        }),
        'control refresh'
      );
    },

    async park() {
      await assertOk(
        await fetchImpl(refreshUrl, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${options.refreshSecret}`,
          },
        }),
        'control refresh'
      );
    },
  };
}
