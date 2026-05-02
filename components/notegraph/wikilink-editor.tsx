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
    const top = taRect.top - containerRect.top + caret.top + 22;
    const left = Math.max(0, Math.min(taRect.left - containerRect.left + caret.left, containerRect.width - 240));
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
    setTimeout(() => setShowSuggestions(false), 160);
  }

  React.useEffect(() => {
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
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
          className="absolute z-50 w-60 overflow-hidden animate-fade-in"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            background: 'hsl(var(--popover) / 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.625rem',
            boxShadow: '0 8px 32px hsl(0 0% 0% / 0.18), 0 2px 8px hsl(0 0% 0% / 0.08)',
          }}
        >
          {/* Keyboard hint row */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-border/50">
            <span className="text-[10px] text-muted-foreground">Link to note</span>
            <span className="ml-auto flex items-center gap-1">
              {(['↑↓', 'Tab', 'Esc'] as const).map((k) => (
                <kbd
                  key={k}
                  className="px-1 py-0.5 text-[9px] font-mono rounded"
                  style={{
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  {k}
                </kbd>
              ))}
            </span>
          </div>

          {/* Suggestions */}
          {suggestions.map((note, i) => (
            <button
              key={note.id}
              onMouseDown={(e) => { e.preventDefault(); insertSuggestion(note); }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-100',
                i === selectedIdx
                  ? 'text-accent-foreground'
                  : 'text-foreground hover:bg-muted/60',
              )}
              style={i === selectedIdx ? {
                background: 'hsl(var(--accent))',
                borderLeft: '2px solid hsl(var(--primary))',
              } : { borderLeft: '2px solid transparent' }}
            >
              <span className="flex-1 truncate">{note.title}</span>
              {note.is_placeholder && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    background: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                  }}
                >
                  stub
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
