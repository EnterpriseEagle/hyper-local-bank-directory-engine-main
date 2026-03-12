import Link from "next/link";
import { HeroSearch } from "@/components/hero-search";
import { SwitchOfferCard } from "@/components/switch-banner";
import {
  getStats,
  getStateList,
  getRecentClosures,
  getRecentReportsGlobal,
  getLiveOutageStats,
  getOutageHotspots,
  STATE_NAMES,
} from "@/lib/data";

const REPORT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  working: { label: "Working", icon: "✅", color: "text-emerald-400" },
  atm_empty: { label: "ATM Empty", icon: "❌", color: "text-red-400" },
  branch_closed: { label: "Branch Closed", icon: "❌", color: "text-red-400" },
  long_queue: { label: "Long Queue", icon: "⏳", color: "text-amber-400" },
};

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function HomePage() {
  const [stats, states, closures, recentReports, outageStats, hotspots] =
    await Promise.all([
      getStats(),
      getStateList(),
      getRecentClosures(8),
      getRecentReportsGlobal(4),
      getLiveOutageStats(),
      getOutageHotspots(6),
    ]);

  const totalReports =
    outageStats.atmEmpty +
    outageStats.branchClosed +
    outageStats.longQueue +
    outageStats.working;

  return (
    <div>
        {/* ===== HERO: Search & Destroy ===== */}
        <section className="relative z-20 flex flex-col justify-center overflow-visible bg-black px-6 pt-16 pb-10 sm:px-10 sm:pt-24 sm:pb-14">
          {/* Blue trust glow */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[1100px] max-h-[1100px] rounded-full blur-[180px] opacity-20"
              style={{
                background:
                  "radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(30, 58, 138, 0.3) 40%, rgba(0,0,0,0) 70%)",
              }}
            />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[900px]">
            <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium">
              Australia&apos;s Bank Status Tracker
            </p>

            <h1 className="mb-3 font-serif text-[clamp(2rem,6vw,4rem)] font-light leading-[0.95] text-white tracking-[-0.02em]">
              Find Your Bank.
              <br />
              <span className="text-white/40">See If It&apos;s Actually Working.</span>
            </h1>

            <p className="mb-5 max-w-[560px] text-[15px] font-light leading-[1.6] text-white/45">
              Live crowd-sourced status for {stats.suburbs.toLocaleString()} Australian
              suburbs. Know before you go.
            </p>

            {/* Search Bar */}
            <div className="relative z-30 mb-4">
              <HeroSearch />
            </div>

            {/* Dirty secret stat */}
            <p className="text-[12px] font-light text-white/30">
              <span className="text-red-400/70 font-medium">{stats.closedBranches.toLocaleString()}</span>{" "}
              branches have closed across Australia.{" "}
              <Link href="/#closures" className="underline text-white/40 hover:text-white/60 transition-colors">
                Check your suburb&apos;s status now
              </Link>
            </p>
          </div>
        </section>

      {/* ===== Bank Marquee ===== */}
      <section className="relative z-10 w-full overflow-hidden border-y border-white/[0.06] bg-black py-3">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes marqueeScroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .bank-marquee {
            display: flex;
            width: max-content;
            animation: marqueeScroll 30s linear infinite;
          }
        `,
          }}
        />
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-black to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-black to-transparent" />
        <div className="bank-marquee">
          {[
            "Commonwealth Bank",
            "Westpac",
            "ANZ",
            "NAB",
            "Bendigo Bank",
            "Bank of Queensland",
            "Suncorp",
            "Macquarie Bank",
            "ING",
            "HSBC",
            "Commonwealth Bank",
            "Westpac",
            "ANZ",
            "NAB",
            "Bendigo Bank",
            "Bank of Queensland",
            "Suncorp",
            "Macquarie Bank",
            "ING",
            "HSBC",
          ].map((bank, i) => (
            <span
              key={i}
              className="whitespace-nowrap px-10 sm:px-14 font-sans text-[13px] font-medium tracking-wide text-white/25"
            >
              {bank}
            </span>
          ))}
        </div>
      </section>

        {/* ===== THE DENY SECTION: Monetization ===== */}
        <SwitchOfferCard closedBranches={stats.closedBranches} />

      {/* ===== WHAT'S HAPPENING NOW: Compact Live Feed ===== */}
      <section
        id="live-feed"
          className="border-b border-white/5 px-6 sm:px-10 py-12 sm:py-16 bg-black"
      >
        <div className="mx-auto max-w-[1000px]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/70 font-medium">
                  Live Now
                </p>
              </div>
              <h2 className="font-serif text-[clamp(1.75rem,4vw,3rem)] font-light leading-[1.1] text-white">
                What&apos;s Happening Right Now
              </h2>
            </div>
            <div className="text-right">
              <div className="text-[clamp(1.25rem,2vw,1.75rem)] font-serif font-light text-white">
                {totalReports}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                Total Reports
              </div>
            </div>
          </div>

          {/* 4 compact report cards */}
          {recentReports.length === 0 ? (
            <div className="border border-white/5 p-12 text-center">
              <p className="text-white/30 text-[14px] mb-2">
                No reports yet. Be the first to report.
              </p>
              <p className="text-white/20 text-[12px]">
                Visit any suburb page and tap a status button.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5">
              {recentReports.map((r) => {
                const info = REPORT_LABELS[r.reportType] || {
                  label: r.reportType,
                  icon: "❓",
                  color: "text-white/50",
                };
                return (
                  <Link
                    key={r.id}
                    href={`/${r.stateSlug}/${r.suburbSlug}`}
                    className="group bg-black p-6 flex items-start gap-4 transition-all duration-300 hover:bg-white/[0.02]"
                  >
                    <span className="text-xl mt-0.5 shrink-0">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[11px] font-medium uppercase tracking-wide ${info.color}`}
                        >
                          {info.label}
                        </span>
                        <span className="text-[11px] text-white/15">
                          {timeAgo(r.createdAt)}
                        </span>
                      </div>
                      <p className="text-[14px] font-light text-white truncate">
                        {r.branchName}
                      </p>
                      <p className="text-[11px] text-white/25 mt-0.5">
                        {r.suburbName} {r.postcode}, {r.state}
                      </p>
                    </div>
                    <span className="text-white/10 mt-1 transition-all duration-300 group-hover:text-white/30 group-hover:translate-x-1 shrink-0">
                      &rarr;
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* View all reports link */}
          <div className="mt-6 text-center">
            <Link
              href="/#states"
              className="text-[11px] uppercase tracking-[0.2em] text-white/30 hover:text-white/50 transition-colors"
            >
              Browse all suburbs to report &amp; view status &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ===== OUTAGE STATS BAR ===== */}
      <section className="border-b border-white/5 bg-black">
        <div className="mx-auto max-w-[1000px] grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
          {[
            {
              label: "ATMs Empty",
              value: outageStats.atmEmpty,
              color: "text-red-400",
              bg: "bg-red-500/5",
              icon: "❌",
            },
            {
              label: "Branches Closed",
              value: outageStats.branchClosed,
              color: "text-red-400",
              bg: "bg-red-500/5",
              icon: "🚫",
            },
            {
              label: "Long Queues",
              value: outageStats.longQueue,
              color: "text-amber-400",
              bg: "bg-amber-500/5",
              icon: "⏳",
            },
            {
              label: "Confirmed Working",
              value: outageStats.working,
              color: "text-emerald-400",
              bg: "bg-emerald-500/5",
              icon: "✅",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`${card.bg} bg-black p-6 sm:p-8 text-center`}
            >
              <span className="text-lg">{card.icon}</span>
              <div
                className={`text-[clamp(1.25rem,2.5vw,2rem)] font-serif font-light mt-2 ${card.color}`}
              >
                {card.value}
              </div>
              <div className="text-[9px] uppercase tracking-[0.2em] text-white/30 mt-1">
                {card.label}
              </div>
            </div>
          ))}
        </div>
      </section>

        {/* ===== HOW IT WORKS ===== */}
        <section className="border-b border-white/5 px-6 sm:px-10 py-12 sm:py-16 bg-black">
          <div className="mx-auto max-w-[1000px]">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              How It Works
            </p>
            <h2 className="mb-10 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light leading-[1.1] text-white">
              DownDetector for Banks.
              <br />
              <span className="text-white/30">Crowd-sourced. Real-time. Zero login.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
              {[
                {
                  step: "01",
                  title: "Find Your Suburb",
                  desc: "Search Australian suburbs to see banks & ATMs near you.",
                  icon: "🔍",
                },
                {
                  step: "02",
                  title: "Report Status",
                  desc: "One tap. No login. Report if an ATM is empty, branch closed, or queues are long.",
                  icon: "📡",
                },
                {
                  step: "03",
                  title: "Community Benefits",
                  desc: "Every report updates live status. Know before you go. Switch if you're fed up.",
                  icon: "⚡",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="bg-black p-6 sm:p-8"
                >
                  <span className="text-2xl mb-3 block">{item.icon}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-medium">
                    Step {item.step}
                  </span>
                  <h3 className="font-serif text-[20px] font-light text-white mt-2 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[14px] font-light leading-[1.7] text-white/40">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== OUTAGE HOTSPOTS ===== */}
        {hotspots.length > 0 && (
          <section className="border-b border-white/5 px-6 sm:px-10 py-12 sm:py-16 bg-black">
            <div className="mx-auto max-w-[1000px]">
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-red-400/50 font-medium">
                Hotspots
              </p>
              <h2 className="mb-4 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light leading-[1.1] text-white">
                Outage Hotspots
              </h2>
              <p className="mb-8 max-w-[500px] text-[15px] font-light leading-[1.7] text-white/40">
                Suburbs with the highest number of service failure reports.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
                {hotspots.map((h) => (
                  <Link
                    key={h.suburbSlug}
                    href={`/${h.stateSlug}/${h.suburbSlug}`}
                    className="group bg-black p-5 sm:p-6 transition-all duration-500 hover:bg-red-500/[0.02]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-red-400/60">
                        {h.reportCount} {h.reportCount === 1 ? "report" : "reports"}
                      </span>
                      <span className="text-white/15 transition-all duration-300 group-hover:text-red-400/50 group-hover:translate-x-1">
                        &rarr;
                      </span>
                    </div>
                    <h3 className="font-serif text-[18px] font-light text-white mb-1">
                      {h.suburbName}
                    </h3>
                    <p className="text-[12px] text-white/30">
                      {h.postcode}, {h.state}
                    </p>
                    <div className="mt-3 h-px w-0 bg-red-400/20 transition-all duration-700 group-hover:w-full" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

      {/* ===== INFRASTRUCTURE STATS ===== */}
      <section className="relative flex items-center justify-center overflow-hidden border-b border-white/5 px-6 py-14 sm:px-8 sm:py-20 bg-black">
        <div className="mx-auto w-full max-w-[900px] text-center">
          <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.3em] text-white/50">
            The Numbers
          </p>
          <h2 className="mb-10 font-serif text-[clamp(1.75rem,5vw,3rem)] font-light leading-[1.15] tracking-[-0.02em] text-white">
            Australia&apos;s banking infrastructure,
            <br />
            <span className="text-white/30">monitored by the people.</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-12 sm:gap-16">
            {[
              { label: "Suburbs Tracked", value: stats.suburbs.toLocaleString() },
              { label: "Open Branches", value: stats.openBranches.toLocaleString() },
              { label: "ATMs Mapped", value: stats.atms.toLocaleString() },
              { label: "Branch Closures", value: stats.closedBranches.toLocaleString() },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-[clamp(1.5rem,3vw,2.5rem)] font-serif font-light text-white">
                  {stat.value}
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BROWSE STATES ===== */}
      <section
        id="states"
          className="border-b border-white/5 px-6 py-12 sm:px-10 sm:py-16 bg-black"
        >
          <div className="mx-auto w-full max-w-[1200px]">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              Browse
            </p>
            <h2 className="mb-4 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light leading-[1.1] text-white">
              States &amp; Territories
            </h2>
            <p className="mb-8 max-w-[500px] text-[15px] font-light leading-[1.7] text-white/40">
            Select your state to find bank branches, ATMs, and report live
            service status in your suburb.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {states.map((s) => (
              <Link
                key={s.stateSlug}
                href={`/${s.stateSlug}`}
                className="group bg-black p-8 transition-all duration-500 hover:bg-white/[0.02]"
              >
                <h3 className="font-serif text-[18px] font-light text-white mb-2 transition-all duration-300 group-hover:translate-x-1">
                  {STATE_NAMES[s.stateSlug] || s.state}
                </h3>
                <p className="text-[12px] text-white/30">{s.count} suburbs</p>
                <div className="mt-4 h-px w-0 bg-white/20 transition-all duration-700 group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RECENT CLOSURES ===== */}
      <section
        id="closures"
          className="border-b border-white/5 px-6 py-12 sm:px-10 sm:py-16 bg-black"
        >
          <div className="mx-auto w-full max-w-[1000px]">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-red-400/40 font-medium">
              Monitoring
            </p>
            <h2 className="mb-4 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light leading-[1.1] text-white">
              Recent Branch Closures
            </h2>
            <p className="mb-8 max-w-[600px] text-[15px] font-light leading-[1.7] text-white/40">
            Banks are shutting branches across Australia. Track the closures
            affecting your community.
          </p>

          {closures.length === 0 ? (
            <p className="text-white/30 text-[14px]">
              No recent closures recorded.
            </p>
          ) : (
            <div className="border-t border-white/5">
              {closures.map((c, i) => (
                <Link
                  key={i}
                  href={`/${c.stateSlug}/${c.suburbSlug}`}
                  className="group flex items-center justify-between py-5 border-b border-white/5 transition-all duration-300 hover:pl-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[15px] font-light text-white transition-colors duration-300 group-hover:text-white/80">
                      {c.branchName}
                    </p>
                    <p className="text-[12px] text-white/30 mt-1">
                      {c.suburbName} {c.postcode}, {c.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {c.closedDate && (
                      <span className="text-[11px] text-red-400/70">
                        {c.closedDate}
                      </span>
                    )}
                    <span className="text-[14px] text-white/20 transition-all duration-300 group-hover:text-white/50 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>



      {/* ===== BOTTOM CTA ===== */}
        <section className="px-6 py-14 sm:px-10 sm:py-20 bg-black">
        <div className="mx-auto w-full max-w-[600px] text-center">
          <h2 className="mb-6 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light leading-[1.1] text-white tracking-[-0.01em]">
            Know before you go.
          </h2>
          <p className="mb-8 text-[15px] font-light leading-[1.7] text-white/40">
            Search your suburb. Check the live status. Report what you see.
            Help your community.
          </p>
          <div className="flex items-center justify-center gap-5">
            <Link
              href="#states"
              className="group relative inline-block overflow-hidden border border-white/30 px-10 py-4 text-[11px] uppercase tracking-[0.2em] text-white transition-all duration-500 hover:border-white/70"
            >
              <span className="relative z-10">Find Your Suburb</span>
              <span className="absolute inset-0 -translate-x-full bg-white/[0.03] transition-transform duration-500 group-hover:translate-x-0"></span>
            </Link>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
              name: "BANK NEAR ME\u00ae",
              url: "https://banknearme.com.au",
                description:
                  "Australia's crowd-sourced bank status tracker. Live ATM outages, branch closures, and queue reports across 15,000+ suburbs.",
            potentialAction: {
              "@type": "SearchAction",
              target: "https://banknearme.com.au/search?q={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </div>
  );
}
