const WIKILINK_RE = /\[\[([^\[\]]+?)\]\]/g;

/** Extract all unique [[wikilink]] titles from a body string. */
export function parseWikilinks(body: string): string[] {
  const titles = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = WIKILINK_RE.exec(body)) !== null) {
    const title = match[1].trim();
    if (title.length > 0) titles.add(title);
  }
  return Array.from(titles);
}
