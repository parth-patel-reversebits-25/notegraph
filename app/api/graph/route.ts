import { buildGraph } from '@/lib/services/graphService';
import { ok, handleError } from '@/lib/apiHelpers';

export async function GET(): Promise<Response> {
  try {
    const graph = await buildGraph();
    return ok(graph);
  } catch (e) {
    return handleError(e);
  }
}
