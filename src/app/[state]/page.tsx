import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBanksInState, getSuburbsByState, STATE_NAMES, STATE_ABBR } from "@/lib/data";
import { StructuredData } from "@/components/structured-data";
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
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const stateName = STATE_NAMES[state];
  if (!stateName) return {};

  return buildMetadata({
    title: `Bank Branches and ATMs in ${stateName} - Find Your Local Branch`,
    description: `Find bank branches, ATMs, and banking services across ${stateName}. Browse suburbs, compare opening hours, and track local branch closures in ${STATE_ABBR[state]}.`,
    path: `/${state}`,
    keywords: [
      `${stateName} bank branches`,
      `${stateName} ATMs`,
      `${stateName} branch closures`,
      `${STATE_ABBR[state]} bank directory`,
    ],
  });
}

export default async function StatePage({ params }: Props) {
  const { state } = await params;
  const stateName = STATE_NAMES[state];
  if (!stateName) notFound();

  const [suburbs, banksInState] = await Promise.all([
    getSuburbsByState(state),
    getBanksInState(state, 12),
  ]);
  if (suburbs.length === 0) notFound();

  const stateAbbr = STATE_ABBR[state];

  const totalBranches = suburbs.reduce((s, sub) => s + sub.branchCount, 0);
  const totalAtms = suburbs.reduce((s, sub) => s + sub.atmCount, 0);
  const totalClosed = suburbs.reduce((s, sub) => s + sub.closedBranches, 0);
  const featuredSuburbs = suburbs.slice(0, 24);
  const faq = [
    {
      q: `How do I find a bank branch in ${stateName}?`,
      a: `Browse the suburb directory below to open location pages with branch counts, ATM coverage, and live service reporting for ${stateName}.`,
    },
    {
      q: `Can I see branch closures across ${stateName}?`,
      a: totalClosed > 0
        ? `Yes. We currently track ${totalClosed} recent branch closure${totalClosed === 1 ? "" : "s"} across ${stateName}, alongside open locations and nearby alternatives.`
        : `Yes. The state directory highlights open locations first and surfaces closure data as it becomes available across ${stateName}.`,
    },
    {
      q: `Which suburbs in ${stateName} have bank branches and ATMs?`,
      a: `${suburbs.length} suburb${suburbs.length === 1 ? "" : "s"} in ${stateName} currently have banking coverage on the directory, including ${totalBranches} open branches and ${totalAtms} ATMs.`,
    },
  ];

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: absoluteUrl("/") },
    { name: stateName, url: absoluteUrl(`/${state}`) },
  ]);

  const collectionSchema = buildCollectionPageSchema({
    name: `Bank branches and ATMs in ${stateName}`,
    description: `Directory of bank branches, ATMs, and local service coverage across ${stateName}.`,
    url: absoluteUrl(`/${state}`),
    numberOfItems: suburbs.length,
    about: {
      "@type": "AdministrativeArea",
      name: stateName,
      containedInPlace: {
        "@type": "Country",
        name: "Australia",
      },
    },
  });

  const suburbListSchema = buildItemListSchema(
    `Featured suburb banking pages in ${stateName}`,
    featuredSuburbs.map((suburb) => ({
      name: `${toTitleCase(suburb.name)} ${suburb.postcode}`,
      url: absoluteUrl(`/${state}/${suburb.slug}`),
      description: `${suburb.branchCount} branch${suburb.branchCount === 1 ? "" : "es"} and ${suburb.atmCount} ATM${suburb.atmCount === 1 ? "" : "s"}`,
    }))
  );
  const bankListSchema = buildItemListSchema(
    `Popular banks in ${stateName}`,
    banksInState.map((bank) => ({
      name: bank.bankName,
      url: absoluteUrl(`/bank/${bank.bankSlug}/${state}`),
      description: `${bank.branchCount} branches and ${bank.atmCount} ATMs in ${stateName}`,
    }))
  );

  const faqSchema = buildFAQSchema(faq);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-10 py-3">
          <nav className="flex items-center gap-2 text-[11px] text-white/30">
            <Link href="/" className="transition-colors duration-300 hover:text-white underline-reveal">
              Home
            </Link>
            <span className="text-white/15">/</span>
            <span className="text-white/60">{stateName}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <section className="relative overflow-hidden border-b border-white/5 px-6 sm:px-10 py-16 sm:py-24 bg-black">
        {/* Subtle glow */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[120px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(30, 58, 138, 0.6) 0%, rgba(30, 58, 138, 0) 70%)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-[1000px] mx-auto">
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-sans font-medium">
            {stateAbbr}
          </p>
          <h1 className="mb-6 font-serif text-[clamp(2rem,5vw,4rem)] font-light leading-[1.05] text-white">
            Bank Branches &amp; ATMs
            <br />
            in {stateName}
          </h1>
          <p className="max-w-[500px] text-[15px] font-light leading-[1.6] text-white/50">
            Browse {suburbs.length} suburbs across {stateAbbr} to find bank
            branches, ATMs, opening hours and track recent closures.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-10 mt-12">
            {[
              { label: "Suburbs", value: suburbs.length },
              { label: "Open Branches", value: totalBranches },
              { label: "ATMs", value: totalAtms },
              ...(totalClosed > 0
                ? [{ label: "Closures", value: totalClosed }]
                : []),
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

      {/* Suburbs Grid */}
      <section className="px-6 sm:px-10 py-16 sm:py-24 bg-black">
        <div className="max-w-[1200px] mx-auto">
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-sans font-medium">
            All Suburbs
          </p>
          <h2 className="mb-10 font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.1] text-white">
            {stateName}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {suburbs.map((sub) => (
              <Link
                key={sub.slug}
                href={`/${state}/${sub.slug}`}
                className="group bg-black p-6 transition-all duration-500 hover:bg-white/[0.02]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans text-[15px] font-light text-white transition-all duration-300 group-hover:translate-x-0.5">
                      {toTitleCase(sub.name)}
                    </h3>
                    <p className="text-[12px] text-white/30 mt-1">
                      {sub.postcode}, {sub.state}
                    </p>
                  </div>
                  <span className="text-[14px] text-white/15 transition-all duration-300 group-hover:text-white/40 group-hover:translate-x-1 shrink-0">
                    &rarr;
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  {sub.branchCount > 0 && (
                    <span className="text-[11px] text-white/30">
                      {sub.branchCount} {sub.branchCount === 1 ? "branch" : "branches"}
                    </span>
                  )}
                  {sub.atmCount > 0 && (
                    <span className="text-[11px] text-white/30">
                      {sub.atmCount} {sub.atmCount === 1 ? "ATM" : "ATMs"}
                    </span>
                  )}
                  {sub.closedBranches > 0 && (
                    <span className="text-[11px] text-red-400/60">
                      {sub.closedBranches} closed
                    </span>
                  )}
                </div>

                <div className="mt-3 h-px w-0 bg-white/15 transition-all duration-700 group-hover:w-full" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {banksInState.length > 0 && (
        <section className="border-t border-white/5 px-6 sm:px-10 py-16 sm:py-24 bg-black">
          <div className="max-w-[1200px] mx-auto">
            <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-sans font-medium">
              Banks in {stateAbbr}
            </p>
            <h2 className="mb-10 font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.1] text-white">
              Popular Bank Networks in {stateName}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
              {banksInState.map((bank) => (
                <Link
                  key={bank.bankSlug}
                  href={`/bank/${bank.bankSlug}/${state}`}
                  className="group bg-black p-6 transition-all duration-300 hover:bg-white/[0.03]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[17px] font-light text-white transition-transform group-hover:translate-x-1">
                        {bank.bankName}
                      </h3>
                      <p className="mt-2 text-[11px] uppercase tracking-widest text-white/30">
                        {bank.branchCount} branches • {bank.atmCount} ATMs
                      </p>
                      <p className="mt-3 text-[13px] text-white/45">
                        Coverage across {bank.suburbCount} suburbs in {stateAbbr}.
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

      {/* SEO content */}
      <section className="border-t border-white/5 px-6 sm:px-10 py-16 sm:py-24 bg-black">
        <div className="max-w-[640px] mx-auto">
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-sans font-medium">
            About
          </p>
          <h2 className="mb-8 font-serif text-[clamp(1.25rem,3vw,2rem)] font-light leading-[1.1] text-white">
            Banking Services in {stateName}
          </h2>
          <div className="space-y-5">
            <p className="text-[14px] font-light leading-[1.7] text-white/40">
              {stateName} has {suburbs.length} suburbs with banking services
              tracked on BANK NEAR ME&reg;. Currently there are {totalBranches} open
              bank branches and {totalAtms} ATMs across the state
              {totalClosed > 0
                ? `, with ${totalClosed} branches having recently closed`
                : ""}
              .
            </p>
            <p className="text-[14px] font-light leading-[1.7] text-white/40">
              Major banks operating in {stateAbbr} include Commonwealth Bank,
              Westpac, ANZ, NAB, and regional banks like Bendigo Bank and Bank of
              Queensland. Use the suburb listings above to find detailed branch
              information including opening hours, BSB numbers, and accessibility
              features.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 px-6 sm:px-10 py-16 sm:py-20 bg-black">
        <div className="max-w-[900px] mx-auto">
          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
            FAQ
          </p>
          <h2 className="mb-10 font-serif text-[clamp(1.5rem,3vw,2.25rem)] font-light leading-[1.1] text-white">
            Planning a Bank Visit in {stateName}
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

      <StructuredData
        data={[collectionSchema, breadcrumbSchema, suburbListSchema, bankListSchema, faqSchema].filter(Boolean)}
      />
    </div>
  );
}
