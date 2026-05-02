import type {
  Note,
  NoteWithBacklinks,
  NoteVersion,
  GraphData,
  DiffLine,
  CreateNoteInput,
  UpdateNoteInput,
} from '@/lib/types';

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = await res.json() as unknown;
  if (!res.ok) {
    const message = (body as { error?: string })?.error ?? `HTTP ${res.status}`;
    throw new Error(message);
  }
  const wrapped = body as { data?: T };
  return wrapped.data as T;
}

export const api = {
  notes: {
    list: (includeDeleted = false) =>
      request<Note[]>(`/api/notes${includeDeleted ? '?include_deleted=true' : ''}`),
    get: (id: string) => request<NoteWithBacklinks>(`/api/notes/${id}`),
    create: (data: CreateNoteInput) =>
      request<Note>('/api/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateNoteInput) =>
      request<Note>(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<Note>(`/api/notes/${id}`, { method: 'DELETE' }),
    restore: (id: string) =>
      request<Note>(`/api/notes/${id}/restore`, { method: 'POST', body: JSON.stringify({}) }),
    versions: (id: string) => request<NoteVersion[]>(`/api/notes/${id}/versions`),
    version: (id: string, versionId: string) =>
      request<NoteVersion>(`/api/notes/${id}/versions/${versionId}`),
    restoreVersion: (id: string, versionId: string) =>
      request<Note>(`/api/notes/${id}/restore`, {
        method: 'POST',
        body: JSON.stringify({ version_id: versionId }),
      }),
    diff: (id: string, from: string, to: string) =>
      request<{ from: { id: string; version_number: number }; to: { id: string; version_number: number }; diff: DiffLine[] }>(
        `/api/notes/${id}/diff?from=${from}&to=${to}`
      ),
  },
  graph: {
    get: () => request<GraphData>('/api/graph'),
  },
  search: {
    query: (q: string, tags?: string[]) => {
      const params = new URLSearchParams({ q });
      if (tags?.length) params.set('tags', tags.join(','));
      return request<Note[]>(`/api/search?${params}`);
    },
  },
};
