import { NextRequest } from 'next/server';
import { restoreVersion, restoreNote } from '@/lib/services/noteService';
import { ok, err, handleError } from '@/lib/apiHelpers';

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/notes/:id/restore
 *
 * Two behaviors:
 * 1. Body contains { version_id } → restore that version's body as a new version
 * 2. No body / no version_id → un-soft-delete the note
 */
export async function POST(req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // empty body is fine
    }

    const versionId = body?.version_id as string | undefined;

    if (versionId) {
      if (typeof versionId !== 'string') return err('version_id must be a string');
      const note = await restoreVersion(id, versionId);
      return ok(note);
    }

    const note = await restoreNote(id);
    return ok(note);
  } catch (e) {
    return handleError(e);
  }
}
