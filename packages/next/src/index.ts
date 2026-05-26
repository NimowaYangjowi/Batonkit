import type {
  ControlStore,
  RecordHeartbeatInput,
  UpdateOwnershipInput,
} from '@batonkit/core';

export interface ControlPlaneHandlersOptions {
  control: ControlStore;
  secret: string;
  publicRead?: boolean;
}

export interface ControlPlaneHandlers {
  GET: (request?: Request) => Promise<Response>;
  POST: (request: Request) => Promise<Response>;
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  });
}

function isAuthorized(request: Request, secret: string): boolean {
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export function createControlPlaneHandlers(
  options: ControlPlaneHandlersOptions
): ControlPlaneHandlers {
  return {
    async GET(request) {
      if (!options.publicRead && (!request || !isAuthorized(request, options.secret))) {
        return jsonResponse({ error: 'unauthorized' }, { status: 401 });
      }

      return jsonResponse(await options.control.getState());
    },

    async POST(request) {
      if (!isAuthorized(request, options.secret)) {
        return jsonResponse({ error: 'unauthorized' }, { status: 401 });
      }

      const body = (await request.json()) as
        | ({ type: 'heartbeat' } & RecordHeartbeatInput)
        | ({ type: 'ownership' } & UpdateOwnershipInput);

      if (body.type === 'heartbeat') {
        return jsonResponse(await options.control.recordHeartbeat(body));
      }

      if (body.type === 'ownership') {
        return jsonResponse(await options.control.updateOwnership(body));
      }

      return jsonResponse({ error: 'unsupported control event' }, { status: 400 });
    },
  };
}
