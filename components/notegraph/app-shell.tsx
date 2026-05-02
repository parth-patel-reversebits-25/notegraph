'use client';

import * as React from 'react';
import { Moon, Sun, Network, LayoutTemplate, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sidebar } from '@/components/notegraph/sidebar';
import { NoteEditor } from '@/components/notegraph/note-editor';
import { BacklinksPanel } from '@/components/notegraph/backlinks-panel';
import { VersionHistory } from '@/components/notegraph/version-history';
import { GraphView } from '@/components/notegraph/graph-view';
import { CreateNoteDialog } from '@/components/notegraph/create-note-dialog';
import { api } from '@/lib/api';
import type { Note } from '@/lib/types';
import { cn } from '@/lib/utils';

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
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

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

  function handleToggleDeleted() { setShowDeleted((prev) => !prev); }

  function handleSelect(id: string) {
    setSelectedId(id);
    setRightPanelKey((k) => k + 1);
    setViewMode('editor');
    setSidebarOpen(false); // close sidebar on note select (mobile)
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
    setSidebarOpen(false);
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
    <div className="flex h-screen flex-col overflow-hidden bg-background">

      {/* ── Header ────────────────────────────────────────── */}
      <header className="relative flex h-13 items-center gap-3 border-b border-border/60 px-4 shrink-0 z-30"
        style={{ background: 'hsl(var(--surface))' }}>

        {/* Hamburger — mobile only */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 md:hidden"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2.5 select-none">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
            style={{ background: 'hsl(var(--primary) / 0.15)' }}>
            <Network className="h-3.5 w-3.5" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">NoteGraph</span>
        </div>

        <div className="flex-1" />

        {/* View mode pill toggle */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5"
          style={{ background: 'hsl(var(--muted))' }}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode('editor')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all duration-150',
                    viewMode === 'editor'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <LayoutTemplate className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Editor</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Editor view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode('graph')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all duration-150',
                    viewMode === 'graph'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Network className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Graph</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Graph view</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Theme toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {mounted && resolvedTheme === 'dark'
                  ? <Sun className="h-4 w-4 transition-transform duration-300" />
                  : <Moon className="h-4 w-4 transition-transform duration-300" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {mounted && resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </header>

      {/* ── Body ──────────────────────────────────────────── */}
      <div className="relative flex flex-1 overflow-hidden">

        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="sidebar-backdrop absolute inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — fixed on mobile, static on md+ */}
        <div
          className={cn(
            // Shared styles
            'absolute inset-y-0 left-0 z-20 md:relative md:z-auto md:translate-x-0',
            // Mobile slide animation
            'transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )}
        >
          <Sidebar
            notes={notes}
            loading={loading}
            selectedId={selectedId}
            onSelect={handleSelect}
            onCreate={() => setCreateOpen(true)}
            showDeleted={showDeleted}
            onToggleDeleted={handleToggleDeleted}
          />
        </div>

        {/* Main content */}
        <main className="flex flex-1 overflow-hidden min-w-0">
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
              {/* Right panel */}
              <aside
                className="hidden lg:flex w-64 shrink-0 flex-col overflow-hidden border-l border-border/60"
                style={{ background: 'hsl(var(--surface))' }}
              >
                <Tabs defaultValue="backlinks" className="flex flex-col h-full">
                  <TabsList
                    className="rounded-none border-b border-border/60 h-10 shrink-0 w-full justify-start px-2 gap-0.5"
                    style={{ background: 'hsl(var(--surface))' }}
                  >
                    <TabsTrigger
                      value="backlinks"
                      className="text-xs h-7 px-3 rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                    >
                      Backlinks
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="text-xs h-7 px-3 rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                    >
                      History
                    </TabsTrigger>
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
            /* Empty state */
            <div className="flex flex-1 items-center justify-center animate-fade-in">
              <div className="text-center space-y-5 px-6 max-w-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: 'hsl(var(--primary) / 0.1)' }}>
                  <Network className="h-8 w-8" style={{ color: 'hsl(var(--primary))' }} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-base font-semibold tracking-tight">Your knowledge graph awaits</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Select a note from the sidebar, or create your first note to get started.
                  </p>
                </div>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 hover:opacity-90 active:scale-95"
                  style={{
                    background: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                  }}
                >
                  <span className="text-base leading-none">+</span>
                  Create your first note
                </button>
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
