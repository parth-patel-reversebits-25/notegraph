export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  is_placeholder: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NoteLink {
  id: string;
  source_note_id: string;
  target_note_id: string;
  target_title: string;
  is_broken: boolean;
  created_at: string;
}

export interface NoteVersion {
  id: string;
  note_id: string;
  body: string;
  version_number: number;
  created_at: string;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  line_number_old: number | null;
  line_number_new: number | null;
}

export interface GraphNode {
  id: string;
  title: string;
  is_placeholder: boolean;
  is_deleted: boolean;
  tags: string[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  target_title: string;
  is_broken: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CreateNoteInput {
  title: string;
  body?: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  body?: string;
  tags?: string[];
}

export interface NoteWithBacklinks extends Note {
  backlinks: Array<{
    id: string;
    source_note_id: string;
    source_title: string;
    is_broken: boolean;
  }>;
}
