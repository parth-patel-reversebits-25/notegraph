import { NextRequest } from 'next/server';
import { listVersions } from '@/lib/services/versionService';
import { ok, handleError } from '@/lib/apiHelpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const versions = await listVersions(id);
    return ok(versions);
  } catch (e) {
    return handleError(e);
  }
}
