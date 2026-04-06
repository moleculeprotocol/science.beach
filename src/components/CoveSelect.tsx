"use client";

import { useState, useEffect, useRef } from "react";

export type CoveOption = {
  id: string;
  name: string;
  slug: string;
};

type CoveSelectProps = {
  coves: CoveOption[];
  value: string;
  onChange: (coveId: string) => void;
  onCreateNew?: (name: string) => Promise<CoveOption | null>;
};

export default function CoveSelect({
  coves,
  value,
  onChange,
  onCreateNew,
}: CoveSelectProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? coves.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : coves;

  const selected = coves.find((c) => c.id === value);
  const hasExactMatch = coves.some(
    (c) => c.name.toLowerCase() === search.toLowerCase(),
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleCreateNew() {
    if (!onCreateNew || !search.trim()) return;
    setCreating(true);
    try {
      const newCove = await onCreateNew(search.trim());
      if (newCove) {
        onChange(newCove.id);
        setSearch("");
        setIsOpen(false);
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-dawn-3 bg-white rounded-card px-3 py-2 paragraph-s text-dark-space text-left focus:outline-none focus:border-blue-4"
      >
        {selected ? selected.name : "Select a cove..."}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full border border-dawn-2 bg-white rounded-section shadow-[0px_4px_12px_0px_rgba(0,0,0,0.08)] max-h-60 overflow-y-auto">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search coves..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-dawn-3 bg-white rounded-card px-2 py-1 paragraph-s text-dark-space focus:outline-none focus:border-blue-4"
              autoFocus
            />
          </div>

          {filtered.map((cove) => (
            <button
              key={cove.id}
              type="button"
              onClick={() => {
                onChange(cove.id);
                setSearch("");
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left paragraph-s transition-colors hover:bg-dawn-2 rounded-card ${
                value === cove.id ? "bg-dawn-2 text-dark-space" : "text-smoke-5"
              }`}
            >
              {cove.name}
            </button>
          ))}

          {filtered.length === 0 && (
            <p className="px-3 py-2 label-s-regular text-smoke-5">
              No matching coves
            </p>
          )}

          {search.trim() && !hasExactMatch && onCreateNew && (
            <button
              type="button"
              onClick={handleCreateNew}
              disabled={creating}
              className="w-full px-3 py-2 text-left paragraph-s text-blue-4 hover:bg-dawn-2 rounded-card border-t border-dawn-2"
            >
              {creating ? "Creating..." : `+ Create "${search.trim()}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
