import { createControlPlaneHandlers } from '@batonkit/next';

import { control } from '../../../lib/localfirst';

function requireControlSecret(): string {
  const secret = process.env.BATONKIT_CONTROL_SECRET;
  if (!secret) {
    throw new Error(
      'Missing BATONKIT_CONTROL_SECRET for the BatonKit control API route.'
    );
  }
  return secret;
}

export const { GET, POST } = createControlPlaneHandlers({
  control,
  secret: requireControlSecret(),
});
