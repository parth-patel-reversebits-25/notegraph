'use client';

import * as React from 'react';
import { Save, Trash2, RefreshCw, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { WikilinkEditor } from '@/components/notegraph/wikilink-editor';
import { api } from '@/lib/api';
import type { Note } from '@/lib/types';

interface NoteEditorProps {
  noteId: string;
  onSaved: (note: Note) => void;
  onDeleted: (id: string) => void;
  onRestored: (note: Note) => void;
}

export function NoteEditor({ noteId, onSaved, onDeleted, onRestored }: NoteEditorProps) {
  const [note, setNote] = React.useState<Note | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [tagInput, setTagInput] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.notes.get(noteId).then((n) => {
      if (cancelled) return;
      setNote(n);
      setTitle(n.title);
      setBody(n.body ?? '');
      setTags(n.tags ?? []);
      setDirty(false);
      setLoading(false);
    }).catch((e: unknown) => {
      if (cancelled) return;
      setError(e instanceof Error ? e.message : 'Failed to load note');
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [noteId]);

  const markDirty = () => setDirty(true);

  async function save() {
    if (!note) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.notes.update(note.id, { title, body, tags });
      setNote(updated);
      setDirty(false);
      onSaved(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function deleteNote() {
    if (!note) return;
    setSaving(true);
    setError(null);
    try {
      await api.notes.delete(note.id);
      onDeleted(note.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
      setSaving(false);
    }
  }

  async function restoreNote() {
    if (!note) return;
    setSaving(true);
    setError(null);
    try {
      const restored = await api.notes.restore(note.id);
      setNote(restored);
      onRestored(restored);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setSaving(false);
    }
  }

  function addTag(value: string) {
    const tag = value.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      markDirty();
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
    markDirty();
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <div className="flex-1 min-w-0">
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            className="border-0 text-lg font-semibold shadow-none focus-visible:ring-0 px-0"
            placeholder="Untitled"
            disabled={note.is_deleted}
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {note.is_deleted ? (
            <Button size="sm" variant="outline" onClick={restoreNote} disabled={saving} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Restore
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={deleteNote} disabled={saving} title="Delete note">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              <Button size="sm" onClick={save} disabled={saving || !dirty} className="gap-1.5">
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-2 border-b">
        <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 pr-1 text-xs">
              {tag}
              {!note.is_deleted && (
                <button onClick={() => removeTag(tag)} className="rounded-full hover:bg-muted-foreground/20">
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {!note.is_deleted && (
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
                if (e.key === 'Backspace' && !tagInput && tags.length) removeTag(tags[tags.length - 1]);
              }}
              onBlur={() => { if (tagInput) addTag(tagInput); }}
              placeholder="Add tag…"
              className="h-6 w-24 border-0 shadow-none focus-visible:ring-0 text-xs p-0"
            />
          )}
        </div>
      </div>

      <WikilinkEditor
        value={body}
        onChange={(v) => { setBody(v); markDirty(); }}
        placeholder="Write your note here. Use [[wikilinks]] to connect notes."
        className="flex-1 resize-none rounded-none border-0 shadow-none focus-visible:ring-0 font-mono text-sm p-4 w-full"
        disabled={note.is_deleted}
      />

      {note.is_deleted && (
        <div className="border-t bg-muted/50 px-4 py-2 text-xs text-muted-foreground">
          This note is deleted. Restore it to edit.
        </div>
      )}
    </div>
  );
}
