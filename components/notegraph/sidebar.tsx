'use client';

import * as React from 'react';
import { Plus, Search, Trash2, RefreshCw, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Note } from '@/lib/types';

interface SidebarProps {
  notes: Note[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  showDeleted: boolean;
  onToggleDeleted: () => void;
}

export function Sidebar({
  notes,
  loading,
  selectedId,
  onSelect,
  onCreate,
  showDeleted,
  onToggleDeleted,
}: SidebarProps) {
  const [search, setSearch] = React.useState('');

  const safeNotes = Array.isArray(notes) ? notes : [];

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return safeNotes.filter((n) => (n?.title ?? '').toLowerCase().includes(q));
  }, [safeNotes, search]);

  return (
    <aside
      className="flex h-full w-64 min-w-[16rem] max-w-[16rem] flex-shrink-0 flex-col overflow-hidden border-r border-border"
      style={{ background: 'hsl(var(--surface))' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground select-none">
          Notes
        </span>
        <button
          onClick={onCreate}
          title="New note"
          className="flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150 hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ color: 'hsl(var(--primary))' }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-secondary',
              'placeholder:text-muted-foreground text-foreground',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring/60 focus:bg-background',
            )}
          />
        </div>
      </div>

      {/* Note list */}
      <ScrollArea className="flex-1 px-2">
        {loading ? (
          <div className="space-y-1 px-1 py-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-8 w-full rounded-lg"
                style={{ opacity: 1 - i * 0.1 }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              {search ? 'No matches found.' : 'No notes yet. Click + to create one.'}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 py-1">
            {filtered.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                selected={note.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border px-3 py-2">
        <button
          onClick={onToggleDeleted}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-all duration-150',
            showDeleted
              ? 'text-destructive hover:bg-destructive/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent',
          )}
        >
          {showDeleted
            ? <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            : <Trash2 className="h-3.5 w-3.5 shrink-0" />}
          {showDeleted ? 'Hide deleted' : 'Show deleted'}
        </button>
      </div>
    </aside>
  );
}

function NoteItem({
  note,
  selected,
  onSelect,
}: {
  note: Note;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(note.id)}
      className={cn(
        'group relative flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-foreground hover:bg-accent/60',
        note.is_deleted && 'opacity-50',
      )}
    >
      {/* Selected left-accent bar */}
      {selected && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full"
          style={{ background: 'hsl(var(--primary))' }}
        />
      )}

      <FileText
        className={cn(
          'h-3.5 w-3.5 shrink-0 transition-colors duration-150',
          selected ? 'text-accent-foreground' : 'text-muted-foreground group-hover:text-foreground',
        )}
      />

      <span className="flex-1 truncate">{note.title}</span>

      {note.is_placeholder && (
        <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0 rounded-md">
          stub
        </Badge>
      )}
      {note.is_deleted && (
        <Badge variant="destructive" className="text-[10px] px-1 py-0 shrink-0 rounded-md">
          del
        </Badge>
      )}
    </button>
  );
}
