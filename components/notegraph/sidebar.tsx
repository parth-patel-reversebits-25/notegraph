'use client';

import * as React from 'react';
import { Plus, Search, Trash2, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return notes.filter((n) => n.title.toLowerCase().includes(q));
  }, [notes, search]);

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between px-3 py-3">
        <span className="text-sm font-semibold tracking-tight">Notes</span>
        <Button size="icon" variant="ghost" onClick={onCreate} title="New note">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        {loading ? (
          <div className="space-y-1 px-1 py-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-md" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">
            {search ? 'No matches.' : 'No notes yet. Click + to create one.'}
          </p>
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

      <Separator />
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs text-muted-foreground"
          onClick={onToggleDeleted}
        >
          {showDeleted ? <RefreshCw className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
          {showDeleted ? 'Hide deleted' : 'Show deleted'}
        </Button>
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
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        selected
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50 text-foreground',
        note.is_deleted && 'opacity-50'
      )}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="flex-1 truncate">{note.title}</span>
      {note.is_placeholder && (
        <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
          stub
        </Badge>
      )}
      {note.is_deleted && (
        <Badge variant="destructive" className="text-[10px] px-1 py-0 shrink-0">
          del
        </Badge>
      )}
    </button>
  );
}
