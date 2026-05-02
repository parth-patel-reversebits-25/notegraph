'use client';

import * as React from 'react';
import { Link2, Link2Off } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import type { NoteWithBacklinks } from '@/lib/types';

interface BacklinksPanelProps {
  noteId: string;
  onNavigate: (id: string) => void;
}

export function BacklinksPanel({ noteId, onNavigate }: BacklinksPanelProps) {
  const [note, setNote] = React.useState<NoteWithBacklinks | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.notes.get(noteId).then((n) => {
      if (!cancelled) { setNote(n); setLoading(false); }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [noteId]);

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
        Backlinks
      </div>
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : !note?.backlinks.length ? (
          <p className="p-3 text-xs text-muted-foreground">No notes link here.</p>
        ) : (
          <div className="space-y-0.5 p-2">
            {note.backlinks.map((bl) => (
              <button
                key={bl.id}
                onClick={() => onNavigate(bl.source_note_id)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent/50 transition-colors"
              >
                {bl.is_broken ? (
                  <Link2Off className="h-3.5 w-3.5 shrink-0 text-destructive" />
                ) : (
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )}
                <span className="flex-1 truncate text-xs">{bl.source_title}</span>
                {bl.is_broken && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0 shrink-0">broken</Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
