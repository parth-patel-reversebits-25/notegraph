'use client';

import * as React from 'react';
import { RotateCcw, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import type { NoteVersion, DiffLine } from '@/lib/types';

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
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b flex items-center justify-between">
        <span>Version History</span>
        {diffView && (
          <Button size="sm" variant="ghost" className="text-xs h-6 px-2" onClick={() => { setDiffView(null); setDiff(null); }}>
            ← Back
          </Button>
        )}
      </div>

      {error && (
        <div className="px-3 py-2 text-xs text-destructive bg-destructive/10">{error}</div>
      )}

      {diffView ? (
        <ScrollArea className="flex-1">
          <div className="p-3 font-mono text-xs space-y-0.5">
            {diffLoading ? (
              Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
            ) : diff ? (
              diff.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.type === 'added'
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                      : line.type === 'removed'
                      ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                      : 'text-muted-foreground'
                  }
                >
                  <span className="select-none mr-2">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  {line.content}
                </div>
              ))
            ) : null}
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : versions.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">No versions yet.</p>
          ) : (
            <div className="p-2 space-y-1">
              {versions.map((v, idx) => (
                <React.Fragment key={v.id}>
                  <div className="rounded-md px-2 py-2 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">v{v.version_number}</span>
                      <div className="flex items-center gap-1">
                        {idx < versions.length - 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            title="Compare with previous"
                            onClick={() => showDiff(versions[idx + 1].id, v.id)}
                          >
                            <GitCompare className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          title="Restore this version"
                          disabled={restoring === v.id || idx === 0}
                          onClick={() => restoreVersion(v.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>
                  {idx < versions.length - 1 && <Separator className="my-0.5" />}
                </React.Fragment>
              ))}
            </div>
          )}
        </ScrollArea>
      )}
    </div>
  );
}
