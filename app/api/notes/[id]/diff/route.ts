import { NextRequest } from 'next/server';
import { getVersion } from '@/lib/services/versionService';
import { diffBodies } from '@/lib/services/diffService';
import { ok, err, handleError } from '@/lib/apiHelpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const fromId = req.nextUrl.searchParams.get('from');
    const toId = req.nextUrl.searchParams.get('to');

    if (!fromId || !toId) return err('Query params "from" and "to" (version IDs) are required');

    const [fromVersion, toVersion] = await Promise.all([
      getVersion(id, fromId),
      getVersion(id, toId),
    ]);

    const diff = diffBodies(fromVersion.body, toVersion.body);

    return ok({
      from: { id: fromVersion.id, version_number: fromVersion.version_number },
      to: { id: toVersion.id, version_number: toVersion.version_number },
      diff,
    });
  } catch (e) {
    return handleError(e);
  }
}
