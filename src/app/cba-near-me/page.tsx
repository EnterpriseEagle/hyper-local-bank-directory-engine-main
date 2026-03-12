import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/structured-data";
import { SwitchOfferCard } from "@/components/switch-banner";
import {
  getBankBySlug,
  getBankBranchStats,
  getBankStatesPresence,
  getTopSuburbsForBank,
  STATE_NAMES,
} from "@/lib/data";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQSchema,
  buildItemListSchema,
  buildMetadata,
  buildWebPageSchema,
} from "@/lib/seo";
import { toTitleCase } from "@/lib/utils";

const BANK_SLUG = "commonwealth-bank";

export async function generateMetadata(): Promise<Metadata> {
  const bank = await getBankBySlug(BANK_SLUG);
  if (!bank) {
    return { title: "CBA Near Me" };
  }

  const stats = await getBankBranchStats(bank.id);

  return buildMetadata({
    title: `CBA Near Me Australia | ${stats.openBranches} Commonwealth Bank Branches & ${stats.atms} ATMs`,
    description: `Find a Commonwealth Bank near you anywhere in Australia. Explore ${stats.openBranches} open branches, ${stats.atms} ATMs, suburb coverage, and recent closures before you head out.`,
    path: "/cba-near-me",
    imagePath: "/cba-near-me/opengraph-image",
    keywords: [
      "CBA near me",
      "Commonwealth Bank near me",
      "CBA branches near me",
      "CBA ATM near me",
      "Commonwealth Bank ATM near me",
    ],
  });
}

export default async function CBANearMePage() {
  const bank = await getBankBySlug(BANK_SLUG);
  if (!bank) notFound();

  const [stats, states, topSuburbs] = await Promise.all([
    getBankBranchStats(bank.id),
    getBankStatesPresence(bank.id),
    getTopSuburbsForBank(bank.id, 12),
  ]);

  const pageUrl = absoluteUrl("/cba-near-me");
  const directoryUrl = absoluteUrl(`/bank/${bank.slug}`);
  const faq = [
    {
      q: "How do I find a CBA near me in Australia?",
      a: "Use the state and suburb links on this page to drill into Commonwealth Bank coverage, then open the suburb-level page you need for nearby branches, ATM access, and closures.",
    },
    {
      q: "Can I use this page to find a CBA ATM near me?",
      a: `Yes. We currently track ${stats.atms.toLocaleString()} Commonwealth Bank ATM locations nationwide and link CBA coverage back into the broader ATM Near Me hub when you need nearby alternatives.`,
    },
    {
      q: "Does this page include Commonwealth Bank branch closures?",
      a: `Yes. We currently track ${stats.closedBranches.toLocaleString()} closed Commonwealth Bank branches alongside ${stats.openBranches.toLocaleString()} open branches and ATM coverage.`,
    },
    {
      q: "What if my local CBA branch is closed?",
      a: "Use the ATM Near Me and Bank Near Me hubs to find nearby cash access, alternative branches, and other major bank networks before you travel.",
    },
  ];

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: absoluteUrl("/") },
    { name: "CBA Near Me", url: pageUrl },
  ]);
  const pageSchema = buildCollectionPageSchema({
    name: "CBA near me Australia",
    description:
      "Commonwealth Bank finder for nearby branches, ATMs, suburb coverage, and recent closures across Australia.",
    url: pageUrl,
    numberOfItems: topSuburbs.length,
    about: {
      "@type": "BankOrCreditUnion",
      name: bank.name,
      url: bank.website || directoryUrl,
    },
    mainEntity: buildItemListSchema(
      "Commonwealth Bank state coverage",
      states.map((state) => ({
        name: STATE_NAMES[state.stateSlug] || state.state,
        url: absoluteUrl(`/bank/${bank.slug}/${state.stateSlug}`),
        description: `${state.branchCount} branches and ${state.atmCount} ATMs`,
      }))
    ),
  });
  const webPageSchema = buildWebPageSchema({
    name: "CBA Near Me Australia",
    description:
      "Dedicated Commonwealth Bank finder covering nearby branches, ATMs, state pages, suburb pages, and recent closures.",
    url: pageUrl,
  });
  const suburbListSchema = buildItemListSchema(
    "Popular Commonwealth Bank suburbs",
    topSuburbs.map((suburb) => ({
      name: `${toTitleCase(suburb.suburbName)} ${suburb.postcode}`,
      url: absoluteUrl(`/bank/${bank.slug}/${suburb.stateSlug}/${suburb.suburbSlug}`),
      description: `${suburb.branchCount} branches and ${suburb.atmCount} ATMs`,
    }))
  );
  const faqSchema = buildFAQSchema(faq);
  const bankSchema = {
    "@context": "https://schema.org",
    "@type": "BankOrCreditUnion",
    name: bank.name,
    url: bank.website || directoryUrl,
    mainEntityOfPage: pageUrl,
    description:
      "Commonwealth Bank location finder with branch, ATM, closure, and suburb-level coverage across Australia.",
    areaServed: {
      "@type": "Country",
      name: "Australia",
    },
  };

  const quickLinks = [
    {
      label: "Commonwealth Bank Directory",
      href: `/bank/${bank.slug}`,
      meta: `${stats.openBranches.toLocaleString()} branches • ${stats.atms.toLocaleString()} ATMs`,
      description:
        "Open the full national Commonwealth Bank directory with state and suburb drill-down pages.",
    },
    {
      label: "ATM Near Me",
      href: "/atm-near-me",
      meta: "National cash access hub",
      description:
        "Use the ATM finder when you just need a working machine or a nearby fallback option.",
    },
    {
      label: "Bank Near Me",
      href: "/bank-near-me",
      meta: "Compare nearby bank networks",
      description:
        "Compare Commonwealth Bank against other major branch networks and nearby banking alternatives.",
    },
    {
      label: "Latest Closures",
      href: "/closures",
      meta: `${stats.closedBranches.toLocaleString()} closures tracked`,
      description:
        "Check current branch shutdowns before you travel to a Commonwealth Bank location.",
    },
  ];

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="relative overflow-hidden border-b border-white/5 px-6 py-16 sm:px-10 sm:py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-1/2 h-[70vw] w-[70vw] max-h-[900px] max-w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[180px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(255,194,14,0.28) 0%, rgba(59,130,246,0.26) 40%, rgba(0,0,0,0) 75%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1000px]">
          <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/60">CBA Near Me</span>
          </nav>

          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
            Commonwealth Bank Finder
          </p>
          <h1 className="mb-6 font-serif text-[clamp(2.5rem,7vw,4.75rem)] font-light leading-[0.92] tracking-tight">
            Find a CBA near you.
            <br />
            <span className="text-white/30">Branches, ATMs, and closures in one place.</span>
          </h1>
          <p className="mb-8 max-w-[700px] text-[17px] font-light leading-relaxed text-white/50">
            Track Commonwealth Bank across Australia with{" "}
            {stats.openBranches.toLocaleString()} open branches,{" "}
            {stats.atms.toLocaleString()} ATMs, and suburb-level pages that help
            you find the best nearby option before you go.
          </p>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              ["Open Branches", stats.openBranches.toLocaleString()],
              ["Mapped ATMs", stats.atms.toLocaleString()],
              ["States Covered", states.length.toLocaleString()],
              ["Tracked Closures", stats.closedBranches.toLocaleString()],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[clamp(1.4rem,3vw,2.2rem)] font-serif font-light text-white">
                  {value}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/30">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              Quick Routes
            </p>
            <h2 className="mt-3 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light text-white">
              Tie CBA, ATM, and branch intent together
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-white/5">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-black p-6 transition-all duration-300 hover:bg-white/[0.03]"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                  {link.meta}
                </p>
                <h3 className="mt-3 text-[20px] font-light text-white transition-transform group-hover:translate-x-1">
                  {link.label}
                </h3>
                <p className="mt-3 text-[13px] leading-relaxed text-white/45">
                  {link.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SwitchOfferCard closedBranches={stats.closedBranches} />

      <section className="border-b border-white/5 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              State Coverage
            </p>
            <h2 className="mt-3 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light text-white">
              Browse Commonwealth Bank by state
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-white/5">
            {states.map((state) => (
              <Link
                key={state.stateSlug}
                href={`/bank/${bank.slug}/${state.stateSlug}`}
                className="group bg-black p-6 transition-all duration-300 hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[19px] font-light text-white transition-transform group-hover:translate-x-1">
                      {STATE_NAMES[state.stateSlug] || state.state}
                    </h3>
                    <p className="mt-2 text-[11px] uppercase tracking-widest text-white/30">
                      {state.branchCount} branches • {state.atmCount} ATMs
                    </p>
                    <p className="mt-3 text-[13px] text-white/45">
                      Open the full Commonwealth Bank footprint for this state.
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

      {topSuburbs.length > 0 && (
        <section className="border-b border-white/5 px-6 py-16 sm:px-10 sm:py-20">
          <div className="mx-auto max-w-[1100px]">
            <div className="mb-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
                Popular CBA Searches
              </p>
              <h2 className="mt-3 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light text-white">
                Suburbs with the strongest Commonwealth Bank coverage
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-white/5">
              {topSuburbs.map((suburb) => (
                <Link
                  key={`${suburb.stateSlug}-${suburb.suburbSlug}`}
                  href={`/bank/${bank.slug}/${suburb.stateSlug}/${suburb.suburbSlug}`}
                  className="group bg-black p-6 transition-all duration-300 hover:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[19px] font-light text-white transition-transform group-hover:translate-x-1">
                        {toTitleCase(suburb.suburbName)}
                      </h3>
                      <p className="mt-2 text-[11px] uppercase tracking-widest text-white/30">
                        {suburb.postcode}, {suburb.state}
                      </p>
                      <p className="mt-3 text-[13px] text-white/45">
                        {suburb.branchCount} branches • {suburb.atmCount} ATMs
                        {suburb.closedCount > 0 ? ` • ${suburb.closedCount} closures` : ""}
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

      <section className="px-6 py-16 sm:px-10 sm:py-20 bg-black">
        <div className="mx-auto max-w-[720px]">
          <h2 className="mb-10 font-serif text-[clamp(1.5rem,3vw,2.5rem)] font-light text-white">
            CBA Near Me FAQ
          </h2>
          <div className="space-y-10">
            {faq.map((item) => (
              <div key={item.q}>
                <h3 className="mb-3 text-[17px] font-medium text-white/90">
                  {item.q}
                </h3>
                <p className="text-[15px] font-light leading-relaxed text-white/50">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StructuredData
        data={[
          pageSchema,
          webPageSchema,
          breadcrumbSchema,
          suburbListSchema,
          faqSchema,
          bankSchema,
        ].filter(Boolean)}
      />
    </div>
  );
}
