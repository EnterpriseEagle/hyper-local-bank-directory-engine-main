import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getSuburbBySlugInState,
  getBranchesForSuburb,
  getNearbySuburbs,
  getRecentReportsForSuburb,
  getReportCountForSuburb,
  getAllSuburbSlugs,
  STATE_NAMES,
  STATE_ABBR,
} from "@/lib/data";
import { StructuredData } from "@/components/structured-data";
import { StatusReporter } from "@/components/status-reporter";
import { SwitchStickyBar } from "@/components/switch-banner";
import { InlineOfferCard } from "@/components/inline-offer";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQSchema,
  buildItemListSchema,
  buildMetadata,
} from "@/lib/seo";
import { toTitleCase } from "@/lib/utils";

interface Props {
  params: Promise<{ state: string; suburb: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSuburbSlugs();
  return slugs.map((s) => ({
    state: s.stateSlug,
    suburb: s.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, suburb: suburbSlug } = await params;
  const suburb = await getSuburbBySlugInState(suburbSlug, state);
  if (!suburb) return {};

  const stateName = STATE_NAMES[state] || suburb.state;
  const abbr = STATE_ABBR[state] || suburb.state;
  const displayName = toTitleCase(suburb.name);

  return buildMetadata({
    title: `Banks and ATMs in ${displayName}, ${abbr} ${suburb.postcode} - Live Status`,
    description: `Find bank branches, ATMs, and live service status in ${displayName}, ${stateName} ${suburb.postcode}. Report ATM outages, branch closures, and long queues. Updated by the community.`,
    path: `/${state}/${suburb.slug}`,
    keywords: [
      `${displayName} bank branches`,
      `${displayName} ATMs`,
      `${displayName} ${abbr} banks`,
      `${displayName} bank status`,
    ],
    openGraphDescription: `Live crowd-sourced status for banks and ATMs in ${displayName}. Report outages, check service status, and find nearby alternatives.`,
  });
}

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

const REPORT_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  working: { label: "Working", icon: "✅", color: "text-emerald-400" },
  atm_empty: { label: "ATM Empty", icon: "❌", color: "text-red-400" },
  branch_closed: { label: "Branch Closed", icon: "❌", color: "text-red-400" },
  long_queue: { label: "Long Queue", icon: "⏳", color: "text-amber-400" },
};

export const revalidate = 60; // Revalidate every 60s for freshness

export default async function SuburbPage({ params }: Props) {
  const { state, suburb: suburbSlug } = await params;
  const suburb = await getSuburbBySlugInState(suburbSlug, state);
  if (!suburb || suburb.stateSlug !== state) notFound();

  const [branches, nearby, recentReports, reportCount] = await Promise.all([
    getBranchesForSuburb(suburb.id),
    getNearbySuburbs(suburb.id, state, 6),
    getRecentReportsForSuburb(suburb.id, 10),
    getReportCountForSuburb(suburb.id),
  ]);

  const stateName = STATE_NAMES[state] || suburb.state;
  const abbr = STATE_ABBR[state] || suburb.state;

  const displayName = toTitleCase(suburb.name);

  const openBranches = branches.filter(
    (b) => b.type === "branch" && b.status === "open"
  );
  const closedBranches = branches.filter(
    (b) => b.type === "branch" && b.status === "closed"
  );
  const atms = branches.filter((b) => b.type === "atm" && b.status === "open");
  const banksInSuburb = Array.from(
    branches.reduce<
      Map<
        string,
        {
          bankName: string;
          bankSlug: string;
          branchCount: number;
          atmCount: number;
        }
      >
    >((map, branch) => {
      const current = map.get(branch.bankSlug) ?? {
        bankName: branch.bankName,
        bankSlug: branch.bankSlug,
        branchCount: 0,
        atmCount: 0,
      };

      if (branch.type === "branch" && branch.status === "open") {
        current.branchCount += 1;
      }

      if (branch.type === "atm" && branch.status === "open") {
        current.atmCount += 1;
      }

      map.set(branch.bankSlug, current);
      return map;
    }, new Map()).values()
  ).sort((a, b) => b.branchCount - a.branchCount || b.atmCount - a.atmCount || a.bankName.localeCompare(b.bankName));
  const faq = [
    {
      q: `How many bank branches are open in ${displayName}?`,
      a: `${displayName} currently has ${openBranches.length} open bank branch${openBranches.length === 1 ? "" : "es"} and ${atms.length} ATM${atms.length === 1 ? "" : "s"} listed on the directory.`,
    },
    {
      q: `Can I report an ATM outage or long queue in ${displayName}?`,
      a: `Yes. The status reporter on this page lets locals submit anonymous updates for ATM outages, branch closures, and long queues so the suburb page stays current.`,
    },
    {
      q: `Where do I find alternatives if a branch in ${displayName} is closed?`,
      a: nearby.length > 0
        ? `Use the nearby suburb links on this page to find alternative branches and ATMs near ${displayName}, then compare the local status before you travel.`
        : `Use the ATM and branch listings on this page to compare the remaining locations in ${displayName} and nearby suburbs.`,
    },
  ];

  // JSON-LD LocalBusiness markup for each open branch
  const jsonLdItems = openBranches.map((b) => ({
    "@context": "https://schema.org",
    "@type": "BankOrCreditUnion",
    name: b.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: b.address,
      addressLocality: suburb.name,
      addressRegion: abbr,
      postalCode: suburb.postcode,
      addressCountry: "AU",
    },
    ...(b.lat && b.lng
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: b.lat,
            longitude: b.lng,
          },
        }
      : {}),
    ...(b.bsb ? { branchCode: b.bsb } : {}),
    ...(b.openingHours
      ? { openingHours: b.openingHours }
      : {}),
  }));

  const pageUrl = absoluteUrl(`/${state}/${suburb.slug}`);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: absoluteUrl("/") },
    { name: stateName, url: absoluteUrl(`/${state}`) },
    { name: `${displayName} ${suburb.postcode}`, url: pageUrl },
  ]);

  const suburbSchema = buildCollectionPageSchema({
    name: `Banks and ATMs in ${displayName}, ${abbr} ${suburb.postcode}`,
    description: `Live local bank status, ATM access, and closure tracking for ${displayName}, ${stateName}.`,
    url: pageUrl,
    numberOfItems: branches.length,
    about: {
      "@type": "Place",
      name: `${displayName}, ${abbr} ${suburb.postcode}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: displayName,
        addressRegion: abbr,
        postalCode: suburb.postcode,
        addressCountry: "AU",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: suburb.lat,
        longitude: suburb.lng,
      },
    },
  });

  const branchListSchema = buildItemListSchema(
    `Open bank branches in ${displayName}`,
    openBranches.slice(0, 20).map((branch) => ({
      name: branch.name,
      url: absoluteUrl(`/bank/${branch.bankSlug}/${state}/${suburb.slug}`),
      description: branch.address,
    }))
  );
  const bankListSchema = buildItemListSchema(
    `Banks operating in ${displayName}`,
    banksInSuburb.map((bank) => ({
      name: bank.bankName,
      url: absoluteUrl(`/bank/${bank.bankSlug}/${state}/${suburb.slug}`),
      description: `${bank.branchCount} branches and ${bank.atmCount} ATMs in ${displayName}`,
    }))
  );

  const faqSchema = buildFAQSchema(faq);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-3">
          <nav className="flex items-center gap-2 text-[11px] text-white/30">
            <Link
              href="/"
              className="transition-colors duration-300 hover:text-white underline-reveal"
            >
              Home
            </Link>
            <span className="text-white/15">/</span>
            <Link
              href={`/${state}`}
              className="transition-colors duration-300 hover:text-white underline-reveal"
            >
              {stateName}
            </Link>
            <span className="text-white/15">/</span>
            <span className="text-white/60">
              {displayName} {suburb.postcode}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/5 px-6 sm:px-10 py-16 sm:py-24 bg-black">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[120px] opacity-15"
            style={{
              background:
                "radial-gradient(circle, rgba(220, 38, 38, 0.4) 0%, rgba(30, 58, 138, 0.3) 50%, rgba(0,0,0,0) 70%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-[1000px] mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-emerald-400/70">
              Live Status &mdash; {reportCount} Community Reports
            </span>
          </div>

          <h1 className="mb-6 font-serif text-[clamp(2rem,5vw,4rem)] font-light leading-[1.05] text-white">
            Banks and ATMs in {displayName},
            <br />
            {abbr} {suburb.postcode} &mdash; Live Status
          </h1>

          <p className="max-w-[550px] text-[15px] font-light leading-[1.6] text-white/50">
            {openBranches.length} open{" "}
            {openBranches.length === 1 ? "branch" : "branches"},{" "}
            {atms.length} {atms.length === 1 ? "ATM" : "ATMs"}
            {closedBranches.length > 0 && (
              <span className="text-red-400/70">
                , {closedBranches.length} closed
              </span>
            )}
            . Report live status below.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-10 mt-10">
            {[
              { label: "Open Branches", value: openBranches.length },
              { label: "ATMs", value: atms.length },
              ...(closedBranches.length > 0
                ? [{ label: "Closures", value: closedBranches.length }]
                : []),
              { label: "Reports", value: reportCount },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-[clamp(1.25rem,2.5vw,2rem)] font-serif font-light text-white">
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

      {/* Open Branches — FIRST, this is what people came for */}
      {openBranches.length > 0 && (
        <section className="border-b border-white/5 px-6 sm:px-10 py-16 sm:py-20 bg-black">
          <div className="max-w-[1000px] mx-auto">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              Open Branches
            </p>
            <h2 className="mb-8 font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.1] text-white">
              Bank Branches in {displayName}
            </h2>

            <div className="border-t border-white/5">
              {openBranches.map((b, i) => (
                <div key={b.id}>
                  <div className="py-5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-emerald-400/70 bg-emerald-500/10 px-2 py-0.5">
                          Open
                        </span>
                        <h3 className="text-[15px] font-light text-white truncate">
                          {b.name}
                        </h3>
                      </div>
                      <p className="text-[12px] text-white/30 mt-1">
                        {b.address}
                      </p>
                      {b.openingHours && (
                        <p className="text-[11px] text-white/20 mt-1">
                          Hours: {b.openingHours}
                        </p>
                      )}
                        <div className="flex flex-wrap gap-4 mt-2">
                          {b.bankName && (
                            <Link
                              href={`/bank/${b.bankSlug}/${state}/${suburbSlug}`}
                              className="text-[11px] text-white/25 hover:text-white underline decoration-white/10"
                            >
                              {b.bankName}
                            </Link>
                          )}
                          {b.bsb && (
                            <span className="text-[11px] text-white/25">
                              BSB: {b.bsb}
                            </span>
                          )}
                        </div>
                    </div>
                  </div>
                  {/* Inline affiliate card after every 3rd branch */}
                  {(i + 1) % 3 === 0 && i < openBranches.length - 1 && (
                    <InlineOfferCard
                      suburbName={displayName}
                      suburbSlug={suburb.slug}
                      stateSlug={suburb.stateSlug}
                      nearbyBankName={openBranches[i]?.bankName}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {banksInSuburb.length > 0 && (
        <section className="border-b border-white/5 px-6 sm:px-10 py-16 sm:py-20 bg-black">
          <div className="max-w-[1000px] mx-auto">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              Browse by Bank
            </p>
            <h2 className="mb-8 font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.1] text-white">
              Banks Operating in {displayName}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
              {banksInSuburb.map((bank) => (
                <Link
                  key={bank.bankSlug}
                  href={`/bank/${bank.bankSlug}/${state}/${suburb.slug}`}
                  className="group bg-black p-6 transition-all duration-300 hover:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[17px] font-light text-white transition-transform group-hover:translate-x-1">
                        {bank.bankName}
                      </h3>
                      <p className="mt-2 text-[11px] uppercase tracking-widest text-white/30">
                        {bank.branchCount} branches • {bank.atmCount} ATMs
                      </p>
                    </div>
                    <span className="text-white/20 transition-all duration-300 group-hover:text-white/50 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Status Reporter */}
      <section className="border-b border-white/5 px-6 sm:px-10 py-16 sm:py-20 bg-black">
        <div className="max-w-[1000px] mx-auto">
          <StatusReporter
            branches={branches.map((b) => ({
              id: b.id,
              name: b.name,
              type: b.type,
              status: b.status,
            }))}
            suburbId={suburb.id}
            suburbName={displayName}
          />
        </div>
      </section>

      {/* Recent Reports Feed */}
      {recentReports.length > 0 && (
        <section className="border-b border-white/5 px-6 sm:px-10 py-16 sm:py-20 bg-black">
          <div className="max-w-[1000px] mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/70 font-medium">
                Recent Activity in {displayName}
              </p>
            </div>

            <div className="border-t border-white/5">
              {recentReports.map((r) => {
                const info = REPORT_LABELS[r.reportType] || {
                  label: r.reportType,
                  icon: "❓",
                  color: "text-white/50",
                };
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-4 py-3.5 border-b border-white/5"
                  >
                    <span className="text-base shrink-0">{info.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[11px] font-medium uppercase tracking-wide ${info.color}`}
                        >
                          {info.label}
                        </span>
                        <span className="text-white/10">&mdash;</span>
                        <span className="text-[13px] font-light text-white/70 truncate">
                          {r.branchName}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/20 shrink-0">
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ATMs */}
      {atms.length > 0 && (
        <section className="border-b border-white/5 px-6 sm:px-10 py-16 sm:py-20 bg-black">
          <div className="max-w-[1000px] mx-auto">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              ATMs
            </p>
            <h2 className="mb-8 font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.1] text-white">
              ATMs in {displayName}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5">
              {atms.map((b) => (
                <div key={b.id} className="bg-black p-5">
                  <h3 className="text-[14px] font-light text-white mb-1">
                    {b.name}
                  </h3>
                  <p className="text-[12px] text-white/30">{b.address}</p>
                  <div className="flex gap-3 mt-2">
                    {b.bankName && (
                      <span className="text-[11px] text-white/25">
                        {b.bankName}
                      </span>
                    )}
                    {b.feeRating && (
                      <span className="text-[11px] text-white/25">
                        Fees: {b.feeRating}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Closed Branches */}
      {closedBranches.length > 0 && (
        <section className="border-b border-white/5 px-6 sm:px-10 py-16 sm:py-20 bg-black">
          <div className="max-w-[1000px] mx-auto">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-red-400/40 font-medium">
              Closures
            </p>
            <h2 className="mb-8 font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.1] text-white">
              Closed Branches in {displayName}
            </h2>

            <div className="border-t border-white/5">
              {closedBranches.map((b) => (
                <div
                  key={b.id}
                  className="py-4 border-b border-white/5 flex items-center gap-3"
                >
                  <span className="inline-flex items-center text-[10px] uppercase tracking-wide text-red-400/60 bg-red-500/10 px-2 py-0.5">
                    Closed
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-light text-white/50 line-through decoration-white/15">
                      {b.name}
                    </p>
                    <p className="text-[11px] text-white/20 mt-0.5">
                      {b.address}
                      {b.closedDate && <span> &mdash; Closed {b.closedDate}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nearby Suburbs */}
      {nearby.length > 0 && (
        <section className="border-b border-white/5 px-6 sm:px-10 py-16 sm:py-20 bg-black">
          <div className="max-w-[1000px] mx-auto">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              Nearby
            </p>
            <h2 className="mb-8 font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.1] text-white">
              Nearby Suburbs in {stateName}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
              {nearby.map((sub) => (
                <Link
                  key={sub.slug}
                  href={`/${state}/${sub.slug}`}
                  className="group bg-black p-6 transition-all duration-500 hover:bg-white/[0.02]"
                >
                  <h3 className="font-sans text-[15px] font-light text-white transition-all duration-300 group-hover:translate-x-0.5">
                    {toTitleCase(sub.name)}
                  </h3>
                  <p className="text-[12px] text-white/30 mt-1">
                    {sub.postcode}, {sub.state}
                  </p>
                  <div className="mt-2 flex gap-3">
                    {sub.branchCount > 0 && (
                      <span className="text-[11px] text-white/25">
                        {sub.branchCount}{" "}
                        {sub.branchCount === 1 ? "branch" : "branches"}
                      </span>
                    )}
                    {sub.atmCount > 0 && (
                      <span className="text-[11px] text-white/25">
                        {sub.atmCount} {sub.atmCount === 1 ? "ATM" : "ATMs"}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 h-px w-0 bg-white/15 transition-all duration-700 group-hover:w-full" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SEO Content */}
      <section className="border-b border-white/5 px-6 sm:px-10 py-16 sm:py-20 bg-black">
        <div className="max-w-[640px] mx-auto">
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
            About
          </p>
          <h2 className="mb-8 font-serif text-[clamp(1.25rem,3vw,2rem)] font-light leading-[1.1] text-white">
            Banking in {displayName}, {abbr} {suburb.postcode}
          </h2>
          <div className="space-y-5">
            <p className="text-[14px] font-light leading-[1.8] text-white/40">
              {displayName} ({suburb.postcode}) in {stateName} has{" "}
              {openBranches.length} open bank{" "}
              {openBranches.length === 1 ? "branch" : "branches"} and{" "}
              {atms.length} {atms.length === 1 ? "ATM" : "ATMs"} tracked on
              BANK NEAR ME&reg;
              {closedBranches.length > 0 &&
                `, with ${closedBranches.length} ${closedBranches.length === 1 ? "branch" : "branches"} having recently closed`}
              . The community has submitted {reportCount} live status{" "}
              {reportCount === 1 ? "report" : "reports"} for this suburb.
            </p>
            <p className="text-[14px] font-light leading-[1.8] text-white/40">
              Help keep {displayName} updated &mdash; report the live status
              of any bank branch or ATM above. No login required. Your
              anonymous report helps thousands of people in your community
              know which services are actually working right now.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 px-6 sm:px-10 py-16 sm:py-20 bg-black">
        <div className="max-w-[900px] mx-auto">
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
            FAQ
          </p>
          <h2 className="mb-8 font-serif text-[clamp(1.25rem,3vw,2rem)] font-light leading-[1.1] text-white">
            Visiting a Branch in {displayName}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
            {faq.map((item) => (
              <div key={item.q} className="bg-black p-6">
                <h3 className="mb-3 text-[15px] font-medium text-white/90">
                  {item.q}
                </h3>
                <p className="text-[14px] font-light leading-[1.8] text-white/45">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* Sticky "Deny" Banner */}
        <SwitchStickyBar suburbName={displayName} suburbSlug={suburb.slug} stateSlug={suburb.stateSlug} />

      <StructuredData
        data={[
          suburbSchema,
          breadcrumbSchema,
          branchListSchema,
          bankListSchema,
          faqSchema,
          ...jsonLdItems,
        ].filter(Boolean)}
      />
    </div>
  );
}
