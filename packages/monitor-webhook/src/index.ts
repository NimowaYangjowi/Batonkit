import type { FailoverMonitorEvent } from '@local-first-worker/core';

export interface ParsedMonitorWebhookEvent {
  event: FailoverMonitorEvent;
  reason: string;
}

export function parseMonitorWebhookEvent(
  body: Record<string, unknown>
): ParsedMonitorWebhookEvent {
  const rawStatus = String(body.status ?? body.event ?? '').toLowerCase();

  if (['down', 'failed', 'offline'].includes(rawStatus)) {
    return { event: 'down', reason: 'monitor_down' };
  }

  if (['up', 'recovered', 'online'].includes(rawStatus)) {
    return { event: 'up', reason: 'monitor_up' };
  }

  throw new Error(`Unsupported monitor webhook status: ${rawStatus}`);
}
