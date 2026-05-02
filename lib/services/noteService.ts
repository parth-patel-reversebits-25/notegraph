import { supabase } from '@/lib/supabase';
import { syncLinks, setIncomingLinksBroken } from './linkService';
import { saveVersion, getVersion } from './versionService';
import type { Note, NoteWithBacklinks, CreateNoteInput, UpdateNoteInput } from '@/lib/types';

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const { title, body = '', tags = [] } = input;

  // Check if a placeholder with this title already exists — promote it
  const { data: existing, error: lookupError } = await supabase
    .from('notes')
    .select('*')
    .ilike('title', title)
    .eq('is_deleted', false)
    .maybeSingle();

  if (lookupError) throw new Error(`Lookup failed: ${lookupError.message}`);

  let note: Note;

  if (existing && (existing as Note).is_placeholder) {
    // Promote placeholder to real note
    const { data: updated, error } = await supabase
      .from('notes')
      .update({ body, tags, is_placeholder: false })
      .eq('id', (existing as Note).id)
      .select()
      .single();

    if (error) throw new Error(`Failed to promote placeholder: ${error.message}`);
    note = updated as Note;
  } else if (existing) {
    throw new Error(`Note with title "${title}" already exists`);
  } else {
    const { data: created, error } = await supabase
      .from('notes')
      .insert({ title, body, tags })
      .select()
      .single();

    if (error) throw new Error(`Failed to create note: ${error.message}`);
    note = created as Note;
  }

  await syncLinks(note.id, note.body);
  return note;
}

export async function getNote(id: string): Promise<NoteWithBacklinks> {
  const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();
  if (error) throw new Error(`Note not found: ${error.message}`);
  const note = data as Note;

  const { data: backlinksRaw, error: blError } = await supabase
    .from('note_links')
    .select('id, source_note_id, is_broken, notes!note_links_source_note_id_fkey(title)')
    .eq('target_note_id', id);

  if (blError) throw new Error(`Failed to fetch backlinks: ${blError.message}`);

  const backlinks = (backlinksRaw ?? []).map((row: any) => ({
    id: row.id,
    source_note_id: row.source_note_id,
    source_title: row.notes?.title ?? '',
    is_broken: row.is_broken,
  }));

  return { ...note, backlinks };
}

export async function listNotes(includeDeleted = false): Promise<Note[]> {
  let query = supabase.from('notes').select('*').order('updated_at', { ascending: false });
  if (!includeDeleted) query = query.eq('is_deleted', false);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list notes: ${error.message}`);
  return (data ?? []) as Note[];
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
  const { data: current, error: fetchError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(`Note not found: ${fetchError.message}`);
  const currentNote = current as Note;

  if (currentNote.is_deleted) throw new Error('Cannot update a deleted note');

  // Save current body as a version before overwriting
  await saveVersion(id, currentNote.body);

  const updatePayload: Partial<Note> = {};
  if (input.title !== undefined) updatePayload.title = input.title;
  if (input.body !== undefined) updatePayload.body = input.body;
  if (input.tags !== undefined) updatePayload.tags = input.tags;

  // If promoted from placeholder, clear that flag
  if (currentNote.is_placeholder) updatePayload.is_placeholder = false;

  const { data: updated, error } = await supabase
    .from('notes')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update note: ${error.message}`);
  const updatedNote = updated as Note;

  if (input.body !== undefined) {
    await syncLinks(id, updatedNote.body);
  }

  return updatedNote;
}

export async function softDeleteNote(id: string): Promise<Note> {
  const { data: current, error: fetchError } = await supabase
    .from('notes')
    .select('id, is_deleted')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(`Note not found: ${fetchError.message}`);
  if ((current as Note).is_deleted) throw new Error('Note is already deleted');

  const { data, error } = await supabase
    .from('notes')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to delete note: ${error.message}`);

  // Mark all incoming links as broken
  await setIncomingLinksBroken(id, true);

  return data as Note;
}

export async function restoreNote(id: string): Promise<Note> {
  const { data: current, error: fetchError } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(`Note not found: ${fetchError.message}`);
  const note = current as Note;
  if (!note.is_deleted) throw new Error('Note is not deleted');

  // Check title conflict with another active note
  const { data: conflict } = await supabase
    .from('notes')
    .select('id')
    .ilike('title', note.title)
    .eq('is_deleted', false)
    .neq('id', id)
    .maybeSingle();

  if (conflict) throw new Error(`Cannot restore: title "${note.title}" is taken by another active note`);

  const { data, error } = await supabase
    .from('notes')
    .update({ is_deleted: false, deleted_at: null })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to restore note: ${error.message}`);

  await setIncomingLinksBroken(id, false);
  await syncLinks(id, note.body);

  return data as Note;
}

export async function restoreVersion(noteId: string, versionId: string): Promise<Note> {
  const version = await getVersion(noteId, versionId);
  return updateNote(noteId, { body: version.body });
}

export async function searchNotes(query: string, tags?: string[]): Promise<Note[]> {
  let qb = supabase
    .from('notes')
    .select('*')
    .eq('is_deleted', false)
    .order('updated_at', { ascending: false });

  if (query) {
    qb = qb.ilike('title', `%${query}%`);
  }

  if (tags && tags.length > 0) {
    qb = qb.overlaps('tags', tags);
  }

  const { data, error } = await qb;
  if (error) throw new Error(`Search failed: ${error.message}`);
  return (data ?? []) as Note[];
}
