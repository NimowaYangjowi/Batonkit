import { describe, expect, it } from 'vitest';

import { parseMonitorWebhookEvent } from './index.js';

describe('monitor webhook helper', () => {
  it('parses generic down and up events', () => {
    expect(parseMonitorWebhookEvent({ status: 'down' })).toEqual({
      event: 'down',
      reason: 'monitor_down',
    });
    expect(parseMonitorWebhookEvent({ status: 'up' })).toEqual({
      event: 'up',
      reason: 'monitor_up',
    });
  });

  it('accepts common alias values from external monitoring tools', () => {
    expect(parseMonitorWebhookEvent({ status: 'failed' })).toEqual({
      event: 'down',
      reason: 'monitor_down',
    });
    expect(parseMonitorWebhookEvent({ status: 'offline' })).toEqual({
      event: 'down',
      reason: 'monitor_down',
    });
    expect(parseMonitorWebhookEvent({ status: 'recovered' })).toEqual({
      event: 'up',
      reason: 'monitor_up',
    });
    expect(parseMonitorWebhookEvent({ status: 'online' })).toEqual({
      event: 'up',
      reason: 'monitor_up',
    });
  });

  it('accepts either the status field or the event field', () => {
    expect(parseMonitorWebhookEvent({ event: 'down' })).toEqual({
      event: 'down',
      reason: 'monitor_down',
    });
    expect(parseMonitorWebhookEvent({ event: 'up' })).toEqual({
      event: 'up',
      reason: 'monitor_up',
    });
  });
});
