'use client';

import * as React from 'react';
import { Moon, Sun, Network, LayoutTemplate } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/notegraph/sidebar';
import { NoteEditor } from '@/components/notegraph/note-editor';
import { BacklinksPanel } from '@/components/notegraph/backlinks-panel';
import { VersionHistory } from '@/components/notegraph/version-history';
import { GraphView } from '@/components/notegraph/graph-view';
import { CreateNoteDialog } from '@/components/notegraph/create-note-dialog';
import { api } from '@/lib/api';
import type { Note } from '@/lib/types';

export function AppShell() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showDeleted, setShowDeleted] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [rightPanelKey, setRightPanelKey] = React.useState(0);
  const [viewMode, setViewMode] = React.useState<'editor' | 'graph'>('editor');

  async function loadNotes(includeDeleted: boolean) {
    setLoading(true);
    try {
      const data = await api.notes.list(includeDeleted);
      setNotes(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { loadNotes(showDeleted); }, [showDeleted]);

  function handleToggleDeleted() {
    setShowDeleted((prev) => !prev);
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setRightPanelKey((k) => k + 1);
    setViewMode('editor');
  }

  function handleCreated(note: Note) {
    setNotes((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const exists = safePrev.some((n) => n.id === note.id);
      if (exists) return safePrev.map((n) => (n.id === note.id ? note : n));
      return [note, ...safePrev];
    });
    setSelectedId(note.id);
    setRightPanelKey((k) => k + 1);
  }

  function handleSaved(note: Note) {
    setNotes((prev) => (Array.isArray(prev) ? prev : []).map((n) => n.id === note.id ? note : n));
  }

  function handleDeleted(id: string) {
    if (showDeleted) {
      setNotes((prev) => (Array.isArray(prev) ? prev : []).map((n) => n.id === id ? { ...n, is_deleted: true } : n));
    } else {
      setNotes((prev) => (Array.isArray(prev) ? prev : []).filter((n) => n.id !== id));
      setSelectedId(null);
    }
  }

  function handleRestored(note: Note) {
    setNotes((prev) => (Array.isArray(prev) ? prev : []).map((n) => n.id === note.id ? note : n));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-12 items-center gap-3 border-b px-4 shrink-0">
        <Network className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">NoteGraph</span>
        <div className="flex-1" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant={viewMode === 'graph' ? 'secondary' : 'ghost'}
                onClick={() => setViewMode(viewMode === 'graph' ? 'editor' : 'graph')}
                title="Toggle graph view"
              >
                {viewMode === 'graph' ? (
                  <LayoutTemplate className="h-4 w-4" />
                ) : (
                  <Network className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {viewMode === 'graph' ? 'Editor view' : 'Graph view'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {mounted && resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          notes={notes}
          loading={loading}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreate={() => setCreateOpen(true)}
          showDeleted={showDeleted}
          onToggleDeleted={handleToggleDeleted}
        />

        <main className="flex flex-1 overflow-hidden">
          {viewMode === 'graph' ? (
            <GraphView selectedId={selectedId} onNavigate={handleSelect} />
          ) : selectedId ? (
            <>
              <NoteEditor
                key={selectedId}
                noteId={selectedId}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
                onRestored={handleRestored}
              />
              <Separator orientation="vertical" />
              <aside className="w-64 shrink-0 flex flex-col overflow-hidden border-l">
                <Tabs defaultValue="backlinks" className="flex flex-col h-full">
                  <TabsList className="rounded-none border-b h-9 shrink-0 w-full justify-start px-2 gap-1 bg-muted/30">
                    <TabsTrigger value="backlinks" className="text-xs h-7 px-2">Backlinks</TabsTrigger>
                    <TabsTrigger value="history" className="text-xs h-7 px-2">History</TabsTrigger>
                  </TabsList>
                  <TabsContent value="backlinks" className="flex-1 overflow-hidden mt-0">
                    <BacklinksPanel
                      key={`bl-${selectedId}-${rightPanelKey}`}
                      noteId={selectedId}
                      onNavigate={handleSelect}
                    />
                  </TabsContent>
                  <TabsContent value="history" className="flex-1 overflow-hidden mt-0">
                    <VersionHistory
                      key={`vh-${selectedId}-${rightPanelKey}`}
                      noteId={selectedId}
                      onRestored={() => setRightPanelKey((k) => k + 1)}
                    />
                  </TabsContent>
                </Tabs>
              </aside>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <Network className="h-10 w-10 mx-auto opacity-20" />
                <p className="text-sm">Select a note or create one to get started</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <CreateNoteDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
