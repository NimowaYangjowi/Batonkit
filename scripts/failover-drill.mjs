import { createServer } from 'node:http';

import {
  applyFailoverEvent,
  createMemoryControlStore,
} from '../packages/core/dist/index.js';
import { railwayProvider } from '../packages/provider-railway/dist/index.js';

const calls = [];
const server = createServer((request, response) => {
  calls.push(`${request.method} ${request.url}`);

  if (request.url === '/ready') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (request.url === '/control-plane/refresh') {
    if (request.headers.authorization !== 'Bearer drill-secret') {
      response.writeHead(401, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }

    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ refreshed: true }));
    return;
  }

  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ error: 'not found' }));
});

function listen() {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address());
    });
  });
}

function close() {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

await import('../packages/core/dist/index.js');

const address = await listen();
const readyUrl = `http://${address.address}:${address.port}/ready`;
const control = createMemoryControlStore();
const provider = railwayProvider({
  readyUrl,
  refreshSecret: 'drill-secret',
});

try {
  const down = await applyFailoverEvent({
    control,
    provider,
    event: 'down',
    reason: 'drill_down',
    failbackCooldownMs: 0,
  });
  if (down.action !== 'failed_over') {
    throw new Error(`Expected failed_over, got ${down.action}`);
  }
  if ((await control.getState()).activeOwner !== 'backup') {
    throw new Error('Expected backup ownership after down event');
  }

  const up = await applyFailoverEvent({
    control,
    provider,
    event: 'up',
    reason: 'drill_up',
    failbackCooldownMs: 0,
  });
  if (up.action !== 'restored_local') {
    throw new Error(`Expected restored_local, got ${up.action}`);
  }
  if ((await control.getState()).activeOwner !== 'local') {
    throw new Error('Expected local ownership after up event');
  }

  const expected = [
    'GET /ready',
    'POST /control-plane/refresh',
    'POST /control-plane/refresh',
  ];
  if (JSON.stringify(calls) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected provider calls: ${JSON.stringify(calls)}`);
  }
} finally {
  await close();
}

