import { supabase } from '@/lib/supabase';
import type { NoteVersion } from '@/lib/types';

/** Save current body as a new version snapshot before updating. */
export async function saveVersion(noteId: string, body: string): Promise<NoteVersion> {
  const { data: latest, error: fetchError } = await supabase
    .from('note_versions')
    .select('version_number')
    .eq('note_id', noteId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to fetch latest version: ${fetchError.message}`);

  const nextVersion = (latest?.version_number ?? 0) + 1;

  const { data, error } = await supabase
    .from('note_versions')
    .insert({ note_id: noteId, body, version_number: nextVersion })
    .select()
    .single();

  if (error) throw new Error(`Failed to save version: ${error.message}`);
  return data as NoteVersion;
}

export async function listVersions(noteId: string): Promise<NoteVersion[]> {
  const { data, error } = await supabase
    .from('note_versions')
    .select('*')
    .eq('note_id', noteId)
    .order('version_number', { ascending: false });

  if (error) throw new Error(`Failed to list versions: ${error.message}`);
  return (data ?? []) as NoteVersion[];
}

export async function getVersion(noteId: string, versionId: string): Promise<NoteVersion> {
  const { data, error } = await supabase
    .from('note_versions')
    .select('*')
    .eq('note_id', noteId)
    .eq('id', versionId)
    .single();

  if (error) throw new Error(`Version not found: ${error.message}`);
  return data as NoteVersion;
}
