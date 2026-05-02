'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import type { Note } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (note: Note) => void;
}

export function CreateNoteDialog({ open, onOpenChange, onCreated }: CreateNoteDialogProps) {
  const [title, setTitle] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) { setTitle(''); setError(null); }
  }, [open]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setSaving(true);
    setError(null);
    try {
      const note = await api.notes.create({ title: t, body: '', tags: [] });
      onCreated(note);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pb-1">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
              style={{ background: 'hsl(var(--primary) / 0.12)' }}
            >
              <FileText className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <DialogTitle className="text-base font-semibold">New Note</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your note a title…"
              autoFocus
              className={cn(
                'w-full h-10 px-3 text-sm rounded-lg border border-border/60 bg-muted/40',
                'placeholder:text-muted-foreground/50 text-foreground',
                'transition-all duration-150',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent focus:bg-background',
              )}
            />
            <p className="text-[11px] text-muted-foreground px-0.5">
              You can use <code className="font-mono bg-muted px-1 rounded text-foreground">[[double brackets]]</code> in your note body to link to other notes.
            </p>
          </div>

          {error && (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{
                background: 'hsl(var(--destructive) / 0.08)',
                color: 'hsl(var(--destructive))',
                border: '1px solid hsl(var(--destructive) / 0.2)',
              }}
            >
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-sm font-medium rounded-lg border border-border/60 text-foreground hover:bg-muted transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className={cn(
                'h-9 px-4 text-sm font-medium rounded-lg transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                saving || !title.trim()
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:opacity-90 active:scale-95',
              )}
              style={{
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
              }}
            >
              {saving ? 'Creating…' : 'Create note'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
