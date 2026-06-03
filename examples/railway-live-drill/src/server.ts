import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import { pathToFileURL } from 'node:url';

import type { ControlState, WorkerPlatform } from '@batonkit/core';

import { readDrillConfig } from './config.js';
import { createDrillWorkerRuntime, migrateDrillSchema } from './worker.js';

export interface DrillServerRuntime {
  control: {
    getState: () => Promise<ControlState>;
  };
  platform: WorkerPlatform;
  recordHeartbeat: () => Promise<ControlState>;
  workerId: string;
}

function json(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function serverError(
  response: ServerResponse,
  route: '/ready' | '/control-plane/refresh',
  error: unknown
): void {
  json(response, 500, {
    error: 'drill_server_error',
    message: errorMessage(error),
    route,
  });
}

function isAuthorized(request: IncomingMessage, secret: string): boolean {
  return request.headers.authorization === `Bearer ${secret}`;
}

export function createDrillServerHandler(
  runtime: DrillServerRuntime,
  controlSecret: string,
  now: () => Date = () => new Date()
) {
  return async (request: IncomingMessage, response: ServerResponse) => {
    const url = request.url ?? '/';

    if (request.method === 'GET' && url === '/ready') {
      if (request.headers.authorization && !isAuthorized(request, controlSecret)) {
        json(response, 401, { error: 'unauthorized' });
        return;
      }

      try {
        const state = await runtime.control.getState();
        if (!request.headers.authorization) {
          json(response, 200, { ok: true });
          return;
        }

        json(response, 200, {
          ok: true,
          platform: runtime.platform,
          workerId: runtime.workerId,
          ownership: state.activeOwner,
          mode: state.mode,
        });
      } catch (error) {
        serverError(response, '/ready', error);
      }
      return;
    }

    if (request.method === 'POST' && url === '/control-plane/refresh') {
      if (!isAuthorized(request, controlSecret)) {
        json(response, 401, { error: 'unauthorized' });
        return;
      }

      try {
        const state = await runtime.recordHeartbeat();
        json(response, 200, {
          ok: true,
          refreshedAt: now().toISOString(),
          ownership: state.activeOwner,
        });
      } catch (error) {
        serverError(response, '/control-plane/refresh', error);
      }
      return;
    }

    json(response, 404, { error: 'not found' });
  };
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

export async function closeServerIfListening(
  server: Server,
  isListening: boolean
): Promise<void> {
  if (!isListening) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function main(): Promise<void> {
  const config = readDrillConfig(process.env, { defaultPlatform: 'backup' });
  const runtime = await createDrillWorkerRuntime(config);
  const server = createServer(
    createDrillServerHandler(runtime, config.controlSecret)
  );
  let serverListening = false;

  try {
    await migrateDrillSchema(runtime.client);
    await runtime.start();
    await new Promise<void>((resolve) => {
      server.listen(config.port, '0.0.0.0', () => {
        serverListening = true;
        console.info(
          `BatonKit drill server is listening on port ${config.port} for the ${config.platform} worker.`
        );
        resolve();
      });
    });
    await waitForShutdownSignal();
  } finally {
    await closeServerIfListening(server, serverListening);
    await runtime.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
