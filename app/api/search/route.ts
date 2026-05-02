import { NextRequest } from 'next/server';
import { searchNotes } from '@/lib/services/noteService';
import { ok, handleError } from '@/lib/apiHelpers';

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const query = req.nextUrl.searchParams.get('q') ?? '';
    const tagsParam = req.nextUrl.searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean) : undefined;

    const notes = await searchNotes(query, tags);
    return ok(notes);
  } catch (e) {
    return handleError(e);
  }
}
