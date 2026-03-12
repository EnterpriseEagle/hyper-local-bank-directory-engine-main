import Link from "next/link";
import { HeroSearch } from "@/components/hero-search";
import { StructuredData } from "@/components/structured-data";
import {
  getBanksByBranchCoverage,
  getRecentClosures,
  getStateList,
  getStats,
  getTopSuburbsByBranchCount,
} from "@/lib/data";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQSchema,
  buildItemListSchema,
  buildMetadata,
} from "@/lib/seo";
import { toTitleCase } from "@/lib/utils";

export const metadata = buildMetadata({
  title: "Bank Near Me Australia | Find Nearby Bank Branches and ATMs",
  description:
    "Find a bank near you anywhere in Australia. Search by suburb or postcode, browse the biggest branch networks, and compare nearby ATMs, closures, and local status signals.",
  path: "/bank-near-me",
  keywords: [
    "bank near me Australia",
    "find bank near me",
    "bank branches near me",
    "open bank near me",
    "bank near me suburb search",
  ],
});

const FAQ = [
  {
    q: "How do I find a bank near me in Australia?",
    a: "Use the suburb search at the top of the page, then open a local suburb result to compare nearby branches, ATMs, closures, and live status reports before travelling.",
  },
  {
    q: "Which banks have the biggest branch networks?",
    a: "The national bank directory below highlights the banks with the widest branch coverage and links directly to their national and state landing pages.",
  },
  {
    q: "Can I find nearby alternatives if my local branch has closed?",
    a: "Yes. Each suburb page links to nearby suburbs, alternative banks, ATM pages, and recent closure information so you can find the next best option quickly.",
  },
];

export default async function BankNearMePage() {
  const [stats, states, topSuburbs, topBanks, closures] = await Promise.all([
    getStats(),
    getStateList(),
    getTopSuburbsByBranchCount(12),
    getBanksByBranchCoverage(12),
    getRecentClosures(8),
  ]);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Bank Near Me", url: absoluteUrl("/bank-near-me") },
  ]);

  const pageSchema = buildCollectionPageSchema({
    name: "Bank near me Australia",
    description:
      "National hub for finding nearby bank branches, ATMs, and suburb-level banking coverage in Australia.",
    url: absoluteUrl("/bank-near-me"),
    numberOfItems: topSuburbs.length,
  });

  const suburbListSchema = buildItemListSchema(
    "Top Australian suburbs for bank branch coverage",
    topSuburbs.map((suburb) => ({
      name: `${toTitleCase(suburb.name)} ${suburb.postcode}`,
      url: absoluteUrl(`/${suburb.stateSlug}/${suburb.slug}`),
      description: `${suburb.branchCount} branches and ${suburb.atmCount} ATMs`,
    }))
  );

  const bankListSchema = buildItemListSchema(
    "Banks with the broadest branch coverage in Australia",
    topBanks.map((bank) => ({
      name: bank.bankName,
      url: absoluteUrl(`/bank/${bank.bankSlug}`),
      description: `${bank.branchCount} branches across ${bank.suburbCount} suburbs`,
    }))
  );

  const faqSchema = buildFAQSchema(FAQ);

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="relative overflow-hidden border-b border-white/5 px-6 py-16 sm:px-10 sm:py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-1/2 h-[70vw] w-[70vw] max-h-[900px] max-w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[180px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(59,130,246,0.45) 0%, rgba(220,38,38,0.18) 45%, rgba(0,0,0,0) 75%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1000px]">
          <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/60">Bank Near Me</span>
          </nav>

          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
            National Search Hub
          </p>
          <h1 className="mb-6 font-serif text-[clamp(2.5rem,7vw,4.75rem)] font-light leading-[0.92] tracking-tight">
            Find a bank near you.
            <br />
            <span className="text-white/30">Know if it is actually open.</span>
          </h1>
          <p className="mb-8 max-w-[640px] text-[17px] font-light leading-relaxed text-white/50">
            Search {stats.suburbs.toLocaleString()} Australian suburbs to find
            nearby branches, compare ATMs, and avoid dead trips caused by
            closures or service issues.
          </p>

          <HeroSearch />

          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              ["Tracked Suburbs", stats.suburbs.toLocaleString()],
              ["Open Branches", stats.openBranches.toLocaleString()],
              ["Mapped ATMs", stats.atms.toLocaleString()],
              ["Recent Closures", stats.closedBranches.toLocaleString()],
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
              Biggest Networks
            </p>
            <h2 className="mt-3 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light text-white">
              Banks with the broadest branch coverage
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-white/5">
            {topBanks.map((bank) => (
              <Link
                key={bank.bankSlug}
                href={`/bank/${bank.bankSlug}`}
                className="group bg-black p-6 transition-all duration-300 hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[19px] font-light text-white transition-transform group-hover:translate-x-1">
                      {bank.bankName}
                    </h3>
                    <p className="mt-2 text-[11px] uppercase tracking-widest text-white/30">
                      {bank.branchCount} branches • {bank.atmCount} ATMs
                    </p>
                    <p className="mt-3 text-[13px] text-white/45">
                      Coverage across {bank.suburbCount} Australian suburbs.
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

      <section className="border-b border-white/5 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              Popular Suburbs
            </p>
            <h2 className="mt-3 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light text-white">
              Places with the most nearby branches
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-white/5">
            {topSuburbs.map((suburb) => (
              <Link
                key={suburb.slug}
                href={`/${suburb.stateSlug}/${suburb.slug}`}
                className="group bg-black p-6 transition-all duration-300 hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-[19px] font-light text-white transition-transform group-hover:translate-x-1">
                      {toTitleCase(suburb.name)}
                    </h3>
                    <p className="mt-2 text-[11px] uppercase tracking-widest text-white/30">
                      {suburb.postcode}, {suburb.state}
                    </p>
                    <p className="mt-3 text-[13px] text-white/45">
                      {suburb.branchCount} branches, {suburb.atmCount} ATMs
                      {suburb.closedBranches > 0
                        ? `, ${suburb.closedBranches} closures tracked`
                        : ""}
                      .
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

      <section className="border-b border-white/5 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              Browse States
            </p>
            <h2 className="mt-3 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light text-white">
              Start with your state or territory
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {states.map((state) => (
              <Link
                key={state.stateSlug}
                href={`/${state.stateSlug}`}
                className="group bg-black p-6 transition-all duration-300 hover:bg-white/[0.03]"
              >
                <h3 className="text-[17px] font-light text-white transition-transform group-hover:translate-x-1">
                  {state.state}
                </h3>
                <p className="mt-2 text-[12px] text-white/30">
                  {state.count} suburbs
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-white/5 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-[900px]">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-400/50 font-medium">
              Closures
            </p>
            <h2 className="mt-3 font-serif text-[clamp(1.5rem,3vw,2.5rem)] font-light text-white">
              Recent closures people should know about
            </h2>
          </div>

          <div className="space-y-px bg-white/5">
            {closures.map((closure) => (
              <Link
                key={`${closure.stateSlug}-${closure.suburbSlug}-${closure.branchName}`}
                href={`/${closure.stateSlug}/${closure.suburbSlug}`}
                className="group flex items-center justify-between gap-4 bg-black p-5 transition-all duration-300 hover:bg-white/[0.03]"
              >
                <div>
                  <p className="text-[15px] font-light text-white">
                    {closure.branchName}
                  </p>
                  <p className="mt-1 text-[12px] text-white/35">
                    {toTitleCase(closure.suburbName)} {closure.postcode}, {closure.state}
                  </p>
                </div>
                <span className="text-white/20 transition-all duration-300 group-hover:text-white/50 group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-[900px]">
          <h2 className="mb-10 font-serif text-[clamp(1.5rem,3vw,2.5rem)] font-light text-white">
            Bank Near Me FAQ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
            {FAQ.map((item) => (
              <div key={item.q} className="bg-black p-6">
                <h3 className="mb-3 text-[15px] font-medium text-white/90">
                  {item.q}
                </h3>
                <p className="text-[14px] font-light leading-relaxed text-white/45">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StructuredData
        data={[breadcrumbSchema, pageSchema, suburbListSchema, bankListSchema, faqSchema]}
      />
    </div>
  );
}
