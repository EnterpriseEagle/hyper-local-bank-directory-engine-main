"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  findDirectSearchMatch,
  type SearchRouteResult,
} from "@/lib/search-routing";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchRouteResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
  }

  function selectResult(r: SearchRouteResult) {
    router.push(r.href);
    setQuery("");
    setOpen(false);
  }

  function submitQuery() {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    const directMatch = findDirectSearchMatch(trimmed, results);

    if (directMatch) {
      selectResult(directMatch);
      return;
    }

    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative z-[70] w-full isolate">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitQuery();
            }
          }}
          placeholder="Search suburb, postcode or bank..."
          className="w-full pl-9 pr-4 py-2 text-[12px] font-light tracking-wide border border-white/10 bg-white/[0.03] text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-colors duration-300"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border border-white/30 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-[80] top-full mt-2 w-full overflow-hidden border border-white/10 bg-[#0a0a0a]/98 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-sm max-h-64 overflow-y-auto">
          {results.map((r) => (
            <button
              key={`${r.kind}-${r.slug}`}
              onClick={() => selectResult(r)}
              className="w-full px-4 py-3 text-left hover:bg-white/[0.03] flex items-center justify-between text-[13px] border-b border-white/5 last:border-0 transition-colors duration-300"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-light text-white">{r.name}</span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white/35">
                    {r.kind === "bank" ? "Bank" : "Area"}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-white/30">{r.subtitle}</p>
              </div>
              <span className="text-white/20">&rarr;</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
