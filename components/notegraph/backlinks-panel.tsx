'use client';

import * as React from 'react';
import { Link2, Link2Off, ArrowUpRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { NoteWithBacklinks } from '@/lib/types';
import { cn } from '@/lib/utils';

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

  const backlinks = note?.backlinks ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground select-none">
          Backlinks
        </span>
        {!loading && (
          <span
            className="text-[10px] font-medium tabular-nums rounded-full px-1.5 py-0.5"
            style={{
              background: 'hsl(var(--muted))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            {backlinks.length}
          </span>
        )}
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        ) : backlinks.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-fade-in">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl mb-3"
              style={{ background: 'hsl(var(--muted))' }}
            >
              <Link2 className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">No backlinks yet</p>
            <p className="text-[11px] text-muted-foreground/60 mt-1 leading-relaxed">
              Link here from another note with <code className="font-mono bg-muted px-1 rounded">[[title]]</code>
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 p-2 animate-fade-in">
            {backlinks.map((bl) => (
              <button
                key={bl.id}
                onClick={() => onNavigate(bl.source_note_id)}
                className={cn(
                  'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left',
                  'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  bl.is_broken
                    ? 'hover:bg-destructive/8'
                    : 'hover:bg-muted/60',
                )}
              >
                {bl.is_broken ? (
                  <Link2Off className="h-3.5 w-3.5 shrink-0 text-destructive" />
                ) : (
                  <Link2
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-foreground"
                    style={{ color: bl.is_broken ? undefined : 'hsl(var(--primary) / 0.7)' }}
                  />
                )}

                <span
                  className={cn(
                    'flex-1 truncate text-xs font-medium',
                    bl.is_broken ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {bl.source_title}
                </span>

                {bl.is_broken ? (
                  <span
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      background: 'hsl(var(--destructive) / 0.12)',
                      color: 'hsl(var(--destructive))',
                    }}
                  >
                    broken
                  </span>
                ) : (
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground/0 transition-all duration-150 group-hover:text-muted-foreground shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
