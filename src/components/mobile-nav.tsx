"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/search-bar";

const DESKTOP_NAV_LINKS = [
  { href: "/", label: "Home", className: "text-white/40 hover:text-white" },
  {
    href: "/bank",
    label: "Banks",
    className: "text-white/40 hover:text-white",
  },
  {
    href: "/#live-feed",
    label: "Live Feed",
    className: "text-red-400/60 hover:text-red-400",
  },
  { href: "/#states", label: "States", className: "text-white/40 hover:text-white" },
  {
    href: "/#closures",
    label: "Closures",
    className: "text-white/40 hover:text-white",
  },
  {
    href: "/insights",
    label: "Insights",
    className: "text-white/40 hover:text-white",
  },
];

const MOBILE_QUICK_LINKS = [
  { href: "/bank", label: "Browse Banks", description: "Jump straight to bank brands" },
  { href: "/bank-near-me", label: "Bank Near Me", description: "Find branch coverage fast" },
  { href: "/atm-near-me", label: "ATM Near Me", description: "Find cash access nearby" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop nav links */}
      <div className="hidden sm:flex items-center gap-10">
        {DESKTOP_NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-[10px] uppercase font-medium tracking-[0.25em] transition-colors duration-300 underline-reveal ${link.className}`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 flex-col items-center justify-center sm:hidden"
        aria-label="Toggle Menu"
        aria-expanded={open}
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
          open ? "max-h-[42rem] opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
      >
        <div className="border-b border-white/5 px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
            Search by suburb, postcode or bank
          </p>
          <div className="mt-3">
            <SearchBar />
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
            Quick paths
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {MOBILE_QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border border-white/10 bg-white/[0.02] px-4 py-4 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">
                  {link.label}
                </p>
                <p className="mt-2 text-[13px] text-white/35">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 px-6 py-4 space-y-1">
          {DESKTOP_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block py-3 text-[11px] uppercase font-medium tracking-[0.2em] transition-colors ${
                link.href === "/#live-feed"
                  ? "text-red-400/60 hover:text-red-400"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
