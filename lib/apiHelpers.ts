import { NextResponse } from 'next/server';

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(e: unknown): NextResponse {
  const message = e instanceof Error ? e.message : String(e);

  if (message.includes('not found') || message.includes('No rows')) return err(message, 404);
  if (message.includes('already exists') || message.includes('unique')) return err(message, 409);
  if (message.includes('Cannot update') || message.includes('Cannot restore')) return err(message, 422);

  console.error('[NoteGraph error]', { message });
  return err(message, 500);
}
