import { NextRequest } from 'next/server';
import { getVersion } from '@/lib/services/versionService';
import { ok, handleError } from '@/lib/apiHelpers';

type Params = { params: Promise<{ id: string; versionId: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id, versionId } = await params;
    const version = await getVersion(id, versionId);
    return ok(version);
  } catch (e) {
    return handleError(e);
  }
}
