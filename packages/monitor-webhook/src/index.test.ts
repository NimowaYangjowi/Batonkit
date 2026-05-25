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
});
