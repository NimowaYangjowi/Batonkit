import { NextResponse } from 'next/server';

import { jobs } from '../../../lib/localfirst';

export async function POST() {
  const job = await jobs.enqueue('generate-preview', {
    fileId: `file_${Date.now()}`,
  });

  return NextResponse.json({ job });
}

