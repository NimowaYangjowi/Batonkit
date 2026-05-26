import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { pathToFileURL } from 'node:url';

import { readDrillConfig } from './config.js';
import { createDrillWorkerRuntime, migrateDrillSchema } from './worker.js';

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

function isAuthorized(request: IncomingMessage, secret: string): boolean {
  return request.headers.authorization === `Bearer ${secret}`;
}

function waitForShutdownSignal(): Promise<void> {
  return new Promise((resolve) => {
    let resolved = false;

    const finish = () => {
      if (resolved) {
        return;
      }

      resolved = true;
      resolve();
    };

    process.once('SIGINT', finish);
    process.once('SIGTERM', finish);
  });
}

async function main(): Promise<void> {
  const config = readDrillConfig(process.env, { defaultPlatform: 'backup' });
  const runtime = await createDrillWorkerRuntime(config);
  const server = createServer(async (request, response) => {
    const url = request.url ?? '/';

    if (request.method === 'GET' && url === '/ready') {
      const state = await runtime.control.getState();
      json(response, 200, {
        ok: true,
        platform: runtime.platform,
        workerId: runtime.workerId,
        ownership: state.activeOwner,
        mode: state.mode,
      });
      return;
    }

    if (request.method === 'POST' && url === '/control-plane/refresh') {
      if (!isAuthorized(request, config.controlSecret)) {
        json(response, 401, { error: 'unauthorized' });
        return;
      }

      const state = await runtime.recordHeartbeat();
      json(response, 200, {
        ok: true,
        refreshedAt: new Date().toISOString(),
        ownership: state.activeOwner,
      });
      return;
    }

    json(response, 404, { error: 'not found' });
  });

  try {
    await migrateDrillSchema(runtime.client);
    await runtime.start();
    await new Promise<void>((resolve) => {
      server.listen(config.port, '0.0.0.0', () => {
        console.info(
          `BatonKit drill server is listening on port ${config.port} for the ${config.platform} worker.`
        );
        resolve();
      });
    });
    await waitForShutdownSignal();
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
    await runtime.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
