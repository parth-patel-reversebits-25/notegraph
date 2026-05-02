import { NextRequest } from 'next/server';
import { getNote, updateNote, softDeleteNote } from '@/lib/services/noteService';
import { ok, err, handleError } from '@/lib/apiHelpers';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const note = await getNote(id);
    return ok(note);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, body: noteBody, tags } = body;

    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return err('title must be a non-empty string');
    }

    const updated = await updateNote(id, {
      ...(title !== undefined && { title: title.trim() }),
      ...(noteBody !== undefined && { body: noteBody }),
      ...(tags !== undefined && { tags }),
    });

    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params): Promise<Response> {
  try {
    const { id } = await params;
    const deleted = await softDeleteNote(id);
    return ok(deleted);
  } catch (e) {
    return handleError(e);
  }
}
