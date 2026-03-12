"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  name: string;
  postcode: string;
  state: string;
  slug: string;
  stateSlug: string;
}

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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

  function selectResult(r: SearchResult) {
    router.push(`/${r.stateSlug}/${r.slug}`);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative z-[90] w-full max-w-[640px] isolate">
      <div className="relative">
        <svg
          className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30"
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
          placeholder="Enter suburb or postcode..."
          className="w-full pl-14 pr-36 py-5 text-[16px] font-light tracking-wide border border-white/15 bg-white/[0.04] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all duration-300"
        />
        <button
          onClick={() => {
            if (results.length > 0) selectResult(results[0]);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-3 bg-white text-black text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-white/90 transition-colors duration-300"
        >
          Find Banks
        </button>
        {loading && (
          <div className="absolute right-36 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border border-white/30 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-[100] top-full mt-2 w-full overflow-hidden border border-white/10 bg-[#0a0a0a]/98 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-sm max-h-72 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.slug}
              onClick={() => selectResult(r)}
              className="w-full px-5 py-4 text-left hover:bg-white/[0.04] flex items-center justify-between text-[14px] border-b border-white/5 last:border-0 transition-colors duration-300"
            >
              <span className="font-light text-white">{r.name}</span>
              <span className="text-white/30 text-[12px]">
                {r.postcode}, {r.state}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
