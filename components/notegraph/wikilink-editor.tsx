'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Note } from '@/lib/types';

interface WikilinkEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

// Returns pixel offset of caret position inside a textarea.
function getCaretCoordinates(el: HTMLTextAreaElement, pos: number): { top: number; left: number } {
  const mirror = document.createElement('div');
  const style = window.getComputedStyle(el);

  const copyProps = [
    'boxSizing', 'width', 'overflowX', 'overflowY',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch',
    'fontSize', 'lineHeight', 'fontFamily',
    'textAlign', 'textTransform', 'textIndent',
    'letterSpacing', 'wordSpacing',
  ] as const;

  for (const prop of copyProps) {
    mirror.style.setProperty(prop, style.getPropertyValue(prop));
  }
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.top = '0';
  mirror.style.left = '0';

  const textBefore = document.createTextNode(el.value.slice(0, pos));
  const span = document.createElement('span');
  span.textContent = el.value.slice(pos) || '.';

  mirror.appendChild(textBefore);
  mirror.appendChild(span);
  document.body.appendChild(mirror);

  const spanTop = span.offsetTop;
  const spanLeft = span.offsetLeft;

  document.body.removeChild(mirror);

  return {
    top: spanTop - el.scrollTop,
    left: spanLeft,
  };
}

function findOpenWikilink(text: string, cursor: number): { start: number; query: string } | null {
  const before = text.slice(0, cursor);
  const openIdx = before.lastIndexOf('[[');
  if (openIdx === -1) return null;
  const between = before.slice(openIdx + 2);
  if (between.includes(']]') || between.includes('\n')) return null;
  return { start: openIdx, query: between };
}

export function WikilinkEditor({
  value,
  onChange,
  disabled,
  placeholder,
  className,
}: WikilinkEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [suggestions, setSuggestions] = React.useState<Note[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const [wikilinkStart, setWikilinkStart] = React.useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = React.useState({ top: 0, left: 0 });

  function computeDropdownPos(ta: HTMLTextAreaElement, cursor: number) {
    const taRect = ta.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() ?? taRect;
    const caret = getCaretCoordinates(ta, cursor);
    const top = taRect.top - containerRect.top + caret.top + 20;
    const left = Math.max(0, Math.min(taRect.left - containerRect.left + caret.left, containerRect.width - 224));
    setDropdownPos({ top, left });
  }

  async function searchNotes(query: string) {
    try {
      const results = await api.search.query(query);
      setSuggestions((Array.isArray(results) ? results : []).slice(0, 8));
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    onChange(newValue);

    const cursor = e.target.selectionStart;
    const wikilink = findOpenWikilink(newValue, cursor);

    if (!wikilink) {
      setShowSuggestions(false);
      setSuggestions([]);
      setWikilinkStart(null);
      return;
    }

    setWikilinkStart(wikilink.start);
    setSelectedIdx(0);
    computeDropdownPos(e.target, cursor);

    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      searchNotes(wikilink.query).catch(() => null);
    }, 120);
  }

  function insertSuggestion(note: Note) {
    const ta = textareaRef.current;
    if (!ta || wikilinkStart === null) return;

    const cursor = ta.selectionStart;
    const before = value.slice(0, wikilinkStart);
    const after = value.slice(cursor);
    const inserted = `[[${note.title}]]`;
    const newValue = before + inserted + after;
    onChange(newValue);
    setShowSuggestions(false);
    setSuggestions([]);
    setWikilinkStart(null);

    const newCursor = wikilinkStart + inserted.length;
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(newCursor, newCursor);
    }, 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!showSuggestions || !suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Tab' || (e.key === 'Enter' && showSuggestions)) {
      e.preventDefault();
      const note = suggestions[selectedIdx];
      if (note) insertSuggestion(note);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  function handleBlur() {
    // Delay so mousedown on suggestion fires before blur hides it
    setTimeout(() => setShowSuggestions(false), 160);
  }

  React.useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-50 w-56 rounded-md border bg-popover text-popover-foreground shadow-lg overflow-hidden"
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          <div className="px-2 py-1 text-[10px] text-muted-foreground border-b">
            Link to note — ↑↓ navigate · Tab/Enter select · Esc dismiss
          </div>
          {suggestions.map((note, i) => (
            <button
              key={note.id}
              onMouseDown={(e) => {
                e.preventDefault();
                insertSuggestion(note);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
                i === selectedIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/60'
              )}
            >
              <span className="flex-1 truncate">{note.title}</span>
              {note.is_placeholder && (
                <span className="text-[10px] text-muted-foreground shrink-0">stub</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
