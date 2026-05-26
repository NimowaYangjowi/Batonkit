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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isWorkerPlatform(value: unknown): value is 'local' | 'backup' {
  return value === 'local' || value === 'backup';
}

function isWorkerHealthStatus(
  value: unknown
): value is 'ok' | 'degraded' | 'stopping' {
  return value === 'ok' || value === 'degraded' || value === 'stopping';
}

function isControlMode(
  value: unknown
): value is 'local_primary' | 'backup_active' | 'maintenance_override' {
  return (
    value === 'local_primary' ||
    value === 'backup_active' ||
    value === 'maintenance_override'
  );
}

function readOptionalDate(value: unknown): Date | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  throw new Error('invalid date');
}

function readOptionalNullableDate(value: unknown): Date | null | undefined {
  if (value === null) {
    return null;
  }

  return readOptionalDate(value);
}

function parseHeartbeatInput(body: unknown): RecordHeartbeatInput | null {
  if (!isObject(body)) {
    return null;
  }

  if (body.type !== 'heartbeat') {
    return null;
  }

  if (!isWorkerPlatform(body.platform)) {
    return null;
  }

  if (typeof body.workerId !== 'string' || body.workerId.length === 0) {
    return null;
  }

  if (body.status !== undefined && !isWorkerHealthStatus(body.status)) {
    return null;
  }

  try {
    return {
      platform: body.platform,
      workerId: body.workerId,
      status: body.status,
      observedAt: readOptionalDate(body.observedAt),
    };
  } catch {
    return null;
  }
}

function parseOwnershipInput(body: unknown): UpdateOwnershipInput | null {
  if (!isObject(body)) {
    return null;
  }

  if (body.type !== 'ownership') {
    return null;
  }

  if (!isControlMode(body.mode) || !isWorkerPlatform(body.activeOwner)) {
    return null;
  }

  if (
    body.failoverReason !== undefined &&
    body.failoverReason !== null &&
    typeof body.failoverReason !== 'string'
  ) {
    return null;
  }

  try {
    return {
      mode: body.mode,
      activeOwner: body.activeOwner,
      failoverReason: body.failoverReason,
      failbackNotBefore: readOptionalNullableDate(body.failbackNotBefore),
    };
  } catch {
    return null;
  }
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

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ error: 'invalid control event body' }, { status: 400 });
      }

      const heartbeat = parseHeartbeatInput(body);
      if (heartbeat) {
        return jsonResponse(await options.control.recordHeartbeat(heartbeat));
      }

      const ownership = parseOwnershipInput(body);
      if (ownership) {
        return jsonResponse(await options.control.updateOwnership(ownership));
      }

      if (isObject(body) && body.type === 'heartbeat') {
        return jsonResponse({ error: 'invalid heartbeat event' }, { status: 400 });
      }

      if (isObject(body) && body.type === 'ownership') {
        return jsonResponse({ error: 'invalid ownership event' }, { status: 400 });
      }

      return jsonResponse({ error: 'unsupported control event' }, { status: 400 });
    },
  };
}
