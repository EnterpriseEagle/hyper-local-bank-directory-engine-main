
import { Metadata } from "next";
import Link from "next/link";
import { 
  getRecentClosures, 
  getTopClosureSuburbs, 
  getStats,
  STATE_NAMES
} from "@/lib/data";
import { SwitchOfferCard } from "@/components/switch-banner";

export const metadata: Metadata = {
  title: "Bank Branch Closures Australia 2026 - Live Tracker",
  description: "Track the latest bank branch closures across Australia. See which suburbs are losing branches and find the nearest open locations. Commonwealth, ANZ, Westpac, and NAB closure data.",
  alternates: {
    canonical: "https://banknearme.com.au/closures",
  },
};

export default async function ClosuresPage() {
  const [recentClosures, topSuburbs, stats] = await Promise.all([
    getRecentClosures(50),
    getTopClosureSuburbs(20),
    getStats(),
  ]);

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero */}
      <section className="relative px-6 py-20 sm:py-32 border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] rounded-full blur-[180px]"
            style={{
              background: "radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, rgba(0,0,0,0) 70%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1000px] text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/5 text-[10px] font-medium uppercase tracking-[0.2em] text-red-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            Live Closure Tracker
          </div>
          
          <h1 className="mb-8 font-serif text-[clamp(2.5rem,8vw,5rem)] font-light leading-[1] tracking-tight text-white">
            Bank Branch Closures <br />
            <span className="text-white/30">Australia 2026</span>
          </h1>

          <p className="mx-auto mb-12 max-w-[600px] text-[18px] font-light leading-relaxed text-white/50">
            Across Australia, {stats.closedBranches.toLocaleString()} bank branches have been identified as recently closed or scheduled for closure. We track these changes in real-time to help communities find alternative banking options.
          </p>

          <div className="flex flex-wrap justify-center gap-12 pt-10 border-t border-white/5">
             <div>
                <div className="text-[clamp(1.5rem,3vw,3rem)] font-serif font-light text-white">
                  {stats.closedBranches.toLocaleString()}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                  Total Closed Branches
                </div>
              </div>
              <div>
                <div className="text-[clamp(1.5rem,3vw,3rem)] font-serif font-light text-white">
                  {Math.round((stats.closedBranches / (stats.openBranches + stats.closedBranches)) * 100)}%
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                  National Closure Rate
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Monetization */}
      <SwitchOfferCard closedBranches={stats.closedBranches} />

      <div className="mx-auto max-w-[1200px] px-6 py-20 grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Main List */}
        <div className="lg:col-span-2">
          <h2 className="mb-8 font-serif text-[28px] font-light">Recent Closures</h2>
          <div className="space-y-px bg-white/5 border border-white/5">
            {recentClosures.map((c, i) => (
              <div key={i} className="bg-black p-6 flex items-start justify-between gap-4 group hover:bg-white/[0.02] transition-colors">
                <div>
                  <h3 className="text-[16px] font-medium text-white group-hover:text-red-400 transition-colors">
                    {c.branchName}
                  </h3>
                  <p className="text-[13px] text-white/40 mt-1">
                    {c.suburbName}, {c.state} {c.postcode}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-white/20">Closed:</span>
                    <span className="text-[11px] text-white/60 font-medium bg-white/5 px-2 py-0.5 rounded">
                      {c.closedDate || 'Recently'}
                    </span>
                  </div>
                </div>
                <Link 
                  href={`/${c.stateSlug}/${c.suburbSlug}`}
                  className="px-4 py-2 rounded-full border border-white/10 text-[11px] font-medium uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                  View Alternatives
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-16">
          <div>
            <h2 className="mb-8 font-serif text-[24px] font-light">Most Impacted</h2>
            <div className="space-y-6">
              {topSuburbs.map((s, i) => (
                <Link 
                  key={i} 
                  href={`/${s.stateSlug}/${s.slug}`}
                  className="group block border-b border-white/5 pb-4"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[15px] font-light text-white group-hover:text-red-400 transition-colors">
                      {s.name}
                    </span>
                    <span className="text-[12px] font-serif font-light text-red-400/80">
                      {s.closedBranches} closures
                    </span>
                  </div>
                  <p className="text-[11px] text-white/30 uppercase tracking-widest">
                    {s.state} {s.postcode}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-2xl">
            <h3 className="font-serif text-[20px] mb-4">Why the closures?</h3>
            <p className="text-[14px] leading-relaxed text-white/50 font-light">
              Australian banks are rapidly consolidating their physical networks as more customers move to digital banking. However, this leaves many regional areas and vulnerable populations without essential in-person services. BANK NEAR ME&reg; tracks these closures to maintain transparency and help you find the nearest remaining services.
            </p>
          </div>
        </div>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Bank Branch Closures Australia 2026",
            "description": "Live tracker for bank closures across Australia.",
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": recentClosures.map((c, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "name": `${c.branchName} - Closed`,
                "description": `Branch located in ${c.suburbName}, ${c.state} recently closed.`
              }))
            }
          }),
        }}
      />
    </div>
  );
}
