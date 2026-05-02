'use client';

import * as React from 'react';
import { RotateCcw, GitCompare, GitBranch, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import type { NoteVersion, DiffLine } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VersionHistoryProps {
  noteId: string;
  onRestored: () => void;
}

export function VersionHistory({ noteId, onRestored }: VersionHistoryProps) {
  const [versions, setVersions] = React.useState<NoteVersion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [diffView, setDiffView] = React.useState<{ from: string; to: string } | null>(null);
  const [diff, setDiff] = React.useState<DiffLine[] | null>(null);
  const [diffLoading, setDiffLoading] = React.useState(false);
  const [restoring, setRestoring] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.notes.versions(noteId).then((v) => {
      if (!cancelled) { setVersions(v); setLoading(false); }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [noteId]);

  async function showDiff(from: string, to: string) {
    setDiffView({ from, to });
    setDiffLoading(true);
    setDiff(null);
    setError(null);
    try {
      const result = await api.notes.diff(noteId, from, to);
      setDiff(result.diff);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load diff');
    } finally {
      setDiffLoading(false);
    }
  }

  async function restoreVersion(versionId: string) {
    setRestoring(versionId);
    setError(null);
    try {
      await api.notes.restoreVersion(noteId, versionId);
      onRestored();
      const updated = await api.notes.versions(noteId);
      setVersions(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Restore failed');
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground select-none">
          {diffView ? 'Diff View' : 'Version History'}
        </span>
        {diffView && (
          <button
            onClick={() => { setDiffView(null); setDiff(null); }}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-2 text-xs shrink-0"
          style={{
            background: 'hsl(var(--destructive) / 0.08)',
            borderBottom: '1px solid hsl(var(--destructive) / 0.15)',
            color: 'hsl(var(--destructive))',
          }}
        >
          {error}
        </div>
      )}

      {/* Diff view */}
      {diffView ? (
        <ScrollArea className="flex-1">
          <div className="p-3 font-mono text-xs space-y-0.5 animate-fade-in">
            {diffLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full rounded" />
              ))
            ) : diff ? (
              diff.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2 rounded px-2 py-0.5',
                    line.type === 'added'
                      ? 'bg-green-500/10'
                      : line.type === 'removed'
                      ? 'bg-red-500/10'
                      : '',
                  )}
                >
                  <span
                    className={cn(
                      'select-none w-3 shrink-0 text-center font-bold',
                      line.type === 'added' ? 'text-green-500' : line.type === 'removed' ? 'text-red-500' : 'text-muted-foreground/40',
                    )}
                  >
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
                  </span>
                  <span
                    className={cn(
                      'flex-1 break-all leading-relaxed',
                      line.type === 'added'
                        ? 'text-green-700 dark:text-green-400'
                        : line.type === 'removed'
                        ? 'text-red-700 dark:text-red-400'
                        : 'text-muted-foreground',
                    )}
                  >
                    {line.content}
                  </span>
                </div>
              ))
            ) : null}
          </div>
        </ScrollArea>
      ) : (
        /* Version list */
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-fade-in">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl mb-3"
                style={{ background: 'hsl(var(--muted))' }}
              >
                <GitBranch className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">No versions yet</p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                Versions are saved when you save the note.
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1 animate-fade-in">
              {versions.map((v, idx) => (
                <div
                  key={v.id}
                  className="group rounded-lg px-3 py-2.5 transition-all duration-150 hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Version badge */}
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md tabular-nums"
                        style={{
                          background: idx === 0 ? 'hsl(var(--primary) / 0.12)' : 'hsl(var(--muted))',
                          color: idx === 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                        }}
                      >
                        v{v.version_number}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] text-muted-foreground">current</span>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5">
                      {idx < versions.length - 1 && (
                        <button
                          title="Compare with previous"
                          onClick={() => showDiff(versions[idx + 1].id, v.id)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <GitCompare className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        title="Restore this version"
                        disabled={restoring === v.id || idx === 0}
                        onClick={() => restoreVersion(v.id)}
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          idx === 0
                            ? 'text-muted-foreground/30 cursor-not-allowed'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                        )}
                      >
                        <RotateCcw className={cn('h-3.5 w-3.5', restoring === v.id && 'animate-spin')} />
                      </button>
                    </div>
                  </div>

                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(v.created_at).toLocaleString(undefined, {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
