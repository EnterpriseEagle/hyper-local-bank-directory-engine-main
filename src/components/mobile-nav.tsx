"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/search-bar";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav links */}
      <div className="hidden sm:flex items-center gap-10">
        <Link
          href="/"
          className="text-[10px] uppercase font-medium tracking-[0.25em] text-white/40 transition-colors duration-300 hover:text-white underline-reveal"
        >
          Home
        </Link>
        <Link
          href="/#live-feed"
          className="text-[10px] uppercase font-medium tracking-[0.25em] text-red-400/60 transition-colors duration-300 hover:text-red-400 underline-reveal"
        >
          Live Feed
        </Link>
        <Link
          href="/#states"
          className="text-[10px] uppercase font-medium tracking-[0.25em] text-white/40 transition-colors duration-300 hover:text-white underline-reveal"
        >
          States
        </Link>
        <Link
          href="/#closures"
          className="text-[10px] uppercase font-medium tracking-[0.25em] text-white/40 transition-colors duration-300 hover:text-white underline-reveal"
        >
          Closures
        </Link>
        <Link
          href="/insights"
          className="text-[10px] uppercase font-medium tracking-[0.25em] text-white/40 transition-colors duration-300 hover:text-white underline-reveal"
        >
          Insights
        </Link>
      </div>

      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 flex-col items-center justify-center sm:hidden"
        aria-label="Toggle Menu"
      >
        <div className="space-y-1.5 flex flex-col items-end">
          <span
            className={`block h-px bg-white/80 transition-all duration-300 ${
              open ? "w-5 rotate-45 translate-y-[3.5px]" : "w-5"
            }`}
          />
          <span
            className={`block h-px bg-white/80 transition-all duration-300 ${
              open ? "w-0 opacity-0" : "w-3"
            }`}
          />
          <span
            className={`block h-px bg-white/80 transition-all duration-300 ${
              open ? "w-5 -rotate-45 -translate-y-[3.5px]" : "w-5"
            }`}
          />
        </div>
      </button>

      {/* Mobile dropdown */}
      <div
        className={`sm:hidden absolute left-0 right-0 top-full border-b border-white/5 transition-all duration-300 overflow-hidden ${
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
      >
        <div className="px-6 py-4 space-y-1">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="block py-3 text-[11px] uppercase font-medium tracking-[0.2em] text-white/50 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link
            href="/#live-feed"
            onClick={() => setOpen(false)}
            className="block py-3 text-[11px] uppercase font-medium tracking-[0.2em] text-red-400/60 hover:text-red-400 transition-colors"
          >
            Live Feed
          </Link>
          <Link
            href="/#states"
            onClick={() => setOpen(false)}
            className="block py-3 text-[11px] uppercase font-medium tracking-[0.2em] text-white/50 hover:text-white transition-colors"
          >
            States
          </Link>
          <Link
            href="/#closures"
            onClick={() => setOpen(false)}
            className="block py-3 text-[11px] uppercase font-medium tracking-[0.2em] text-white/50 hover:text-white transition-colors"
          >
            Closures
          </Link>
          <Link
            href="/insights"
            onClick={() => setOpen(false)}
            className="block py-3 text-[11px] uppercase font-medium tracking-[0.2em] text-white/50 hover:text-white transition-colors"
          >
            Insights
          </Link>
        </div>
        <div className="px-6 pb-4">
          <SearchBar />
        </div>
      </div>
    </>
  );
}
