import { supabase } from '@/lib/supabase';
import { parseWikilinks } from './linkParser';
import type { Note, NoteLink } from '@/lib/types';

/**
 * Sync note_links for a source note after a body update.
 * - Resolves each linked title to an existing note (or creates placeholder).
 * - Removes stale links no longer in the body.
 * - Adds new links.
 * - Sets is_broken based on target note state.
 */
export async function syncLinks(sourceNoteId: string, body: string): Promise<void> {
  const linkedTitles = parseWikilinks(body);

  // Resolve or create target notes for each linked title
  const targetIds = await Promise.all(linkedTitles.map((title) => resolveOrCreateNote(title)));

  // Build a map: target_note_id → target_title
  const desiredEdges = new Map<string, string>();
  for (let i = 0; i < linkedTitles.length; i++) {
    desiredEdges.set(targetIds[i], linkedTitles[i]);
  }

  // Fetch existing links from this source
  const { data: existingLinks, error: fetchError } = await supabase
    .from('note_links')
    .select('*')
    .eq('source_note_id', sourceNoteId);

  if (fetchError) throw new Error(`Failed to fetch links: ${fetchError.message}`);

  const existing = (existingLinks ?? []) as NoteLink[];
  const existingEdgeMap = new Map(existing.map((l) => [l.target_note_id, l]));

  // Remove stale links
  const toDelete = existing
    .filter((l) => !desiredEdges.has(l.target_note_id))
    .map((l) => l.id);

  if (toDelete.length > 0) {
    const { error } = await supabase.from('note_links').delete().in('id', toDelete);
    if (error) throw new Error(`Failed to delete stale links: ${error.message}`);
  }

  // Add new links
  const toInsert: Array<{
    source_note_id: string;
    target_note_id: string;
    target_title: string;
    is_broken: boolean;
  }> = [];

  for (const [targetId, targetTitle] of desiredEdges.entries()) {
    if (existingEdgeMap.has(targetId)) continue;

    const { data: target, error } = await supabase
      .from('notes')
      .select('is_deleted')
      .eq('id', targetId)
      .single();

    if (error) throw new Error(`Failed to fetch target note ${targetId}: ${error.message}`);

    toInsert.push({
      source_note_id: sourceNoteId,
      target_note_id: targetId,
      target_title: targetTitle,
      is_broken: (target as Pick<Note, 'is_deleted'>).is_deleted,
    });
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('note_links').insert(toInsert);
    if (error) throw new Error(`Failed to insert new links: ${error.message}`);
  }
}

/**
 * Mark all links pointing at a note as broken (on soft-delete)
 * or healed (on restore).
 */
export async function setIncomingLinksBroken(noteId: string, broken: boolean): Promise<void> {
  const { error } = await supabase
    .from('note_links')
    .update({ is_broken: broken })
    .eq('target_note_id', noteId);

  if (error) throw new Error(`Failed to update incoming links: ${error.message}`);
}

/** Find note by title (case-insensitive) or create a placeholder. */
async function resolveOrCreateNote(title: string): Promise<string> {
  const { data, error } = await supabase
    .from('notes')
    .select('id')
    .ilike('title', title)
    .eq('is_deleted', false)
    .maybeSingle();

  if (error) throw new Error(`Failed to resolve note "${title}": ${error.message}`);
  if (data) return (data as { id: string }).id;

  // Create placeholder
  const { data: created, error: insertError } = await supabase
    .from('notes')
    .insert({ title, body: '', is_placeholder: true })
    .select('id')
    .single();

  if (insertError) {
    // Race condition: another request created it simultaneously
    const { data: retry } = await supabase
      .from('notes')
      .select('id')
      .ilike('title', title)
      .eq('is_deleted', false)
      .maybeSingle();

    if (retry) return (retry as { id: string }).id;
    throw new Error(`Failed to create placeholder for "${title}": ${insertError.message}`);
  }

  return (created as { id: string }).id;
}
