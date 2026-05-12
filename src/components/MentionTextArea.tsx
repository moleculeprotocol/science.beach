"use client";

import { useCallback, useEffect, useRef, useState, type TextareaHTMLAttributes } from "react";

type Profile = { handle: string; display_name: string; avatar_bg: string | null };

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  compact?: boolean;
};

// Find an active @mention being typed at the cursor position.
// Returns { query, mentionStart } or null if no active mention.
function getActiveMention(value: string, cursor: number): { query: string; mentionStart: number } | null {
  const textBeforeCursor = value.slice(0, cursor);
  const match = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
  if (!match) return null;
  return {
    query: match[1],
    mentionStart: cursor - match[0].length,
  };
}

export default function MentionTextArea({ compact, className = "", onChange, onKeyDown, ...props }: Props) {
  const [value, setValue] = useState((props.defaultValue as string) ?? "");
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setActiveIndex(0);
    setMentionStart(null);
  }, []);

  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query) { clearSuggestions(); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/profiles/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) { clearSuggestions(); return; }
        const json = await res.json();
        setSuggestions(json.profiles ?? []);
        setActiveIndex(0);
      } catch {
        clearSuggestions();
      }
    }, 150);
  }, [clearSuggestions]);

  const insertMention = useCallback((handle: string) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStart === null) return;
    const cursor = textarea.selectionEnd;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursor);
    const newValue = `${before}@${handle} ${after}`;
    setValue(newValue);
    clearSuggestions();
    // Restore focus and move cursor after inserted handle
    requestAnimationFrame(() => {
      textarea.focus();
      const newCursor = mentionStart + handle.length + 2; // @ + handle + space
      textarea.setSelectionRange(newCursor, newCursor);
    });
  }, [value, mentionStart, clearSuggestions]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange?.(e);

    const cursor = e.target.selectionEnd ?? newValue.length;
    const active = getActiveMention(newValue, cursor);
    if (active) {
      setMentionStart(active.mentionStart);
      fetchSuggestions(active.query);
    } else {
      clearSuggestions();
    }
  }, [onChange, fetchSuggestions, clearSuggestions]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[activeIndex].handle);
        return;
      }
      if (e.key === "Escape") {
        clearSuggestions();
        return;
      }
    }
    onKeyDown?.(e);
  }, [suggestions, activeIndex, insertMention, clearSuggestions, onKeyDown]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (textareaRef.current && !textareaRef.current.closest(".mention-wrapper")?.contains(e.target as Node)) {
        clearSuggestions();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [clearSuggestions]);

  // Sync when form resets (value goes back to empty via defaultValue)
  useEffect(() => {
    if (props.defaultValue === undefined && !props.value) return;
  }, [props.defaultValue, props.value]);

  return (
    <div className="mention-wrapper relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`w-full border border-dawn-2 bg-white rounded-section paragraph-s text-dark-space placeholder:text-smoke-4 focus:outline-none focus:border-blue-4 transition-colors resize-y ${
          compact ? "px-2 py-1.5 text-xs" : "px-4 py-2.5"
        } ${className}`}
        {...props}
      />

      {suggestions.length > 0 && (
        <ul className="absolute left-0 top-full mt-1 z-50 w-[240px] max-h-[200px] overflow-y-auto bg-white border border-dawn-2 rounded-card shadow-lg">
          {suggestions.map((profile, i) => (
            <li key={profile.handle}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(profile.handle); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                  i === activeIndex ? "bg-dawn-2" : "hover:bg-dawn-1"
                }`}
              >
                {/* Avatar circle */}
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ backgroundColor: profile.avatar_bg ?? "#6b7280" }}
                >
                  {profile.display_name.charAt(0).toUpperCase()}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-[12px] font-bold text-dark-space leading-tight truncate">@{profile.handle}</span>
                  <span className="text-[11px] text-smoke-4 leading-tight truncate">{profile.display_name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
