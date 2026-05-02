import type { DiffLine } from '@/lib/types';

/**
 * Compute a line-by-line diff between two bodies using Myers diff algorithm
 * (simplified patience diff).
 */
export function diffBodies(oldBody: string, newBody: string): DiffLine[] {
  const oldLines = oldBody.split('\n');
  const newLines = newBody.split('\n');
  return myersDiff(oldLines, newLines);
}

function myersDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  const lcs = computeLCS(oldLines, newLines);

  let oi = 0; // index into oldLines
  let ni = 0; // index into newLines
  let li = 0; // index into lcs

  let oldLineNum = 1;
  let newLineNum = 1;

  while (oi < oldLines.length || ni < newLines.length) {
    if (
      li < lcs.length &&
      oi < oldLines.length &&
      ni < newLines.length &&
      oldLines[oi] === lcs[li] &&
      newLines[ni] === lcs[li]
    ) {
      result.push({
        type: 'unchanged',
        content: oldLines[oi],
        line_number_old: oldLineNum++,
        line_number_new: newLineNum++,
      });
      oi++;
      ni++;
      li++;
    } else if (
      oi < oldLines.length &&
      (li >= lcs.length || oldLines[oi] !== lcs[li])
    ) {
      result.push({
        type: 'removed',
        content: oldLines[oi],
        line_number_old: oldLineNum++,
        line_number_new: null,
      });
      oi++;
    } else {
      result.push({
        type: 'added',
        content: newLines[ni],
        line_number_old: null,
        line_number_new: newLineNum++,
      });
      ni++;
    }
  }

  return result;
}

/** Compute Longest Common Subsequence of two string arrays. */
function computeLCS(a: string[], b: string[]): string[] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const lcs: string[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcs.unshift(a[i - 1]);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcs;
}
