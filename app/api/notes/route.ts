import { NextRequest } from 'next/server';
import { createNote, listNotes } from '@/lib/services/noteService';
import { ok, err, handleError } from '@/lib/apiHelpers';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const includeDeleted = req.nextUrl.searchParams.get('include_deleted') === 'true';
    const notes = await listNotes(includeDeleted);
    return ok(notes);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { title, body: noteBody, tags } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return err('title is required');
    }

    const note = await createNote({ title: title.trim(), body: noteBody, tags });
    return ok(note, 201);
  } catch (e) {
    return handleError(e);
  }
}
