import { supabase } from '@/lib/supabase';
import type { GraphData, GraphNode, GraphEdge } from '@/lib/types';

export async function buildGraph(): Promise<GraphData> {
  const [notesResult, linksResult] = await Promise.all([
    supabase.from('notes').select('id, title, is_placeholder, is_deleted, tags'),
    supabase.from('note_links').select('id, source_note_id, target_note_id, target_title, is_broken'),
  ]);

  if (notesResult.error) throw new Error(`Failed to fetch notes for graph: ${notesResult.error.message}`);
  if (linksResult.error) throw new Error(`Failed to fetch links for graph: ${linksResult.error.message}`);

  const nodes: GraphNode[] = (notesResult.data ?? []).map((n: any) => ({
    id: n.id,
    title: n.title,
    is_placeholder: n.is_placeholder,
    is_deleted: n.is_deleted,
    tags: n.tags ?? [],
  }));

  const edges: GraphEdge[] = (linksResult.data ?? []).map((l: any) => ({
    id: l.id,
    source: l.source_note_id,
    target: l.target_note_id,
    target_title: l.target_title,
    is_broken: l.is_broken,
  }));

  return { nodes, edges };
}
