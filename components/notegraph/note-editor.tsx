"use client";

import * as React from "react";
import { Save, Trash2, RefreshCw, Tag, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WikilinkEditor } from "@/components/notegraph/wikilink-editor";
import { api } from "@/lib/api";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

interface NoteEditorProps {
  noteId: string;
  onSaved: (note: Note) => void;
  onDeleted: (id: string) => void;
  onRestored: (note: Note) => void;
}

export function NoteEditor({
  noteId,
  onSaved,
  onDeleted,
  onRestored,
}: NoteEditorProps) {
  const [note, setNote] = React.useState<Note | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.notes
      .get(noteId)
      .then((n) => {
        if (cancelled) return;
        setNote(n);
        setTitle(n.title);
        setBody(n.body ?? "");
        setTags(n.tags ?? []);
        setDirty(false);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load note");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  // Ctrl/Cmd + S shortcut
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && note && !note.is_deleted) save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, note, title, body, tags]);

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
      setError(e instanceof Error ? e.message : "Save failed");
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
      setError(e instanceof Error ? e.message : "Delete failed");
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
      setError(e instanceof Error ? e.message : "Restore failed");
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
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
    markDirty();
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-5 min-w-0">
        <Skeleton className="h-9 w-2/3 rounded-lg" />
        <Skeleton className="h-5 w-1/3 rounded-md" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
        </div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden min-w-0">
      {/* ── Deleted banner ───────────────────────────────── */}
      {note.is_deleted && (
        <div
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium shrink-0"
          style={{
            background: "hsl(38 92% 50% / 0.12)",
            borderBottom: "1px solid hsl(38 92% 50% / 0.25)",
            color: "hsl(38 80% 42%)",
          }}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          This note is deleted. Restore it to make edits.
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5 shrink-0"
        style={{ background: "hsl(var(--surface))" }}
      >
        <div className="flex-1 min-w-0">
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            className={cn(
              "w-full text-xl font-semibold tracking-tight bg-transparent",
              "placeholder:text-muted-foreground/40 text-foreground",
              "border-0 outline-none ring-0 p-0",
            )}
            placeholder="Untitled"
            disabled={note.is_deleted}
          />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {note.is_deleted ? (
            <Button
              size="sm"
              variant="outline"
              onClick={restoreNote}
              disabled={saving}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Restore
            </Button>
          ) : (
            <>
              <button
                onClick={deleteNote}
                disabled={saving}
                title="Delete note"
                className="flex h-8 w-8 items-center justify-center rounded-md transition-all duration-150 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                style={{ color: "hsl(var(--destructive))" }}
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={save}
                disabled={saving || !dirty}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium",
                  "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  dirty && !saving
                    ? "opacity-100 hover:opacity-90 active:scale-95"
                    : "opacity-40 cursor-not-allowed",
                )}
                style={{
                  background: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
                title="Save (Ctrl+S)"
              >
                <Save className="h-3.5 w-3.5" />
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Error message ─────────────────────────────────── */}
      {error && (
        <div
          className="px-4 py-2 text-xs font-medium shrink-0"
          style={{
            background: "hsl(var(--destructive) / 0.08)",
            borderBottom: "1px solid hsl(var(--destructive) / 0.15)",
            color: "hsl(var(--destructive))",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Tags row ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 shrink-0 min-h-[36px]">
        <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
              style={{
                background: "hsl(var(--primary) / 0.10)",
                color: "hsl(var(--primary))",
              }}
            >
              {tag}
              {!note.is_deleted && (
                <button
                  onClick={() => removeTag(tag)}
                  className="rounded-sm hover:opacity-70 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
          {!note.is_deleted && (
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                }
                if (e.key === "Backspace" && !tagInput && tags.length)
                  removeTag(tags[tags.length - 1]);
              }}
              onBlur={() => {
                if (tagInput) addTag(tagInput);
              }}
              placeholder="Add tag…"
              className="h-6 min-w-[80px] border-0 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50 p-0"
            />
          )}
        </div>
      </div>

      {/* ── Editor body ──────────────────────────────────── */}
      <WikilinkEditor
        value={body}
        onChange={(v) => {
          setBody(v);
          markDirty();
        }}
        placeholder="Write your note here. Use [[wikilinks]] to link to other notes."
        className={cn(
          "flex-1 resize-none rounded-none border-0 shadow-none",
          "focus:outline-none focus:ring-0",
          "font-mono text-sm leading-relaxed p-6 w-full bg-transparent text-foreground",
          "placeholder:text-muted-foreground/40",
          note.is_deleted && "pointer-events-none",
        )}
        disabled={note.is_deleted}
      />
    </div>
  );
}
