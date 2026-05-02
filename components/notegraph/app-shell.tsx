'use client';

import * as React from 'react';
import { Moon, Sun, Network } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Sidebar } from '@/components/notegraph/sidebar';
import { NoteEditor } from '@/components/notegraph/note-editor';
import { BacklinksPanel } from '@/components/notegraph/backlinks-panel';
import { VersionHistory } from '@/components/notegraph/version-history';
import { CreateNoteDialog } from '@/components/notegraph/create-note-dialog';
import { api } from '@/lib/api';
import type { Note } from '@/lib/types';

export function AppShell() {
  const { theme, setTheme } = useTheme();
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showDeleted, setShowDeleted] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [rightPanelKey, setRightPanelKey] = React.useState(0);

  async function loadNotes(includeDeleted: boolean) {
    setLoading(true);
    try {
      const data = await api.notes.list(includeDeleted);
      setNotes(data);
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
  }

  function handleCreated(note: Note) {
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
    setRightPanelKey((k) => k + 1);
  }

  function handleSaved(note: Note) {
    setNotes((prev) => prev.map((n) => n.id === note.id ? note : n));
  }

  function handleDeleted(id: string) {
    if (showDeleted) {
      setNotes((prev) => prev.map((n) => n.id === id ? { ...n, is_deleted: true } : n));
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setSelectedId(null);
    }
  }

  function handleRestored(note: Note) {
    setNotes((prev) => prev.map((n) => n.id === note.id ? note : n));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-12 items-center gap-3 border-b px-4 shrink-0">
        <Network className="h-5 w-5 text-primary" />
        <span className="font-semibold tracking-tight">NoteGraph</span>
        <div className="flex-1" />
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
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
          {selectedId ? (
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
