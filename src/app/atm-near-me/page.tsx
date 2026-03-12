import Link from "next/link";
import { HeroSearch } from "@/components/hero-search";
import { StructuredData } from "@/components/structured-data";
import {
  getBanksByAtmCoverage,
  getStateList,
  getStats,
  getTopSuburbsByAtmCount,
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
  title: "ATM Near Me Australia | Find Fee-Free and Major Bank ATMs Nearby",
  description:
    "Find ATMs near you across Australia. Search by suburb or postcode, compare major bank ATM networks, and open suburb pages with ATM counts, outages, and nearby alternatives.",
  path: "/atm-near-me",
  keywords: [
    "ATM near me Australia",
    "fee free ATM near me",
    "cash withdrawal near me",
    "major bank ATM finder",
    "ATM near me postcode search",
  ],
});

const FAQ = [
  {
    q: "How do I find an ATM near me in Australia?",
    a: "Search by suburb or postcode, then open the suburb ATM page to compare machines, providers, nearby branch access, and any community-reported issues.",
  },
  {
    q: "Which banks have the biggest ATM networks?",
    a: "This page highlights the banks with the broadest ATM coverage and links directly to their directory pages so you can drill down by state and suburb.",
  },
  {
    q: "Can I avoid empty or offline ATMs?",
    a: "Yes. Suburb ATM pages and linked local status pages help you spot closures, outages, and alternatives before you make the trip.",
  },
];

export default async function ATMNearMePage() {
  const [stats, states, topSuburbs, topBanks] = await Promise.all([
    getStats(),
    getStateList(),
    getTopSuburbsByAtmCount(12),
    getBanksByAtmCoverage(12),
  ]);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: absoluteUrl("/") },
    { name: "ATM Near Me", url: absoluteUrl("/atm-near-me") },
  ]);

  const pageSchema = buildCollectionPageSchema({
    name: "ATM near me Australia",
    description:
      "National hub for finding nearby ATMs, ATM-heavy suburbs, and major bank ATM networks across Australia.",
    url: absoluteUrl("/atm-near-me"),
    numberOfItems: topSuburbs.length,
  });

  const suburbListSchema = buildItemListSchema(
    "Top Australian suburbs for ATM coverage",
    topSuburbs.map((suburb) => ({
      name: `${toTitleCase(suburb.name)} ${suburb.postcode}`,
      url: absoluteUrl(`/atm/${suburb.slug}`),
      description: `${suburb.atmCount} ATMs and ${suburb.branchCount} branches`,
    }))
  );

  const bankListSchema = buildItemListSchema(
    "Banks with the broadest ATM coverage in Australia",
    topBanks.map((bank) => ({
      name: bank.bankName,
      url: absoluteUrl(`/bank/${bank.bankSlug}`),
      description: `${bank.atmCount} ATMs across ${bank.suburbCount} suburbs`,
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
                "radial-gradient(circle, rgba(34,197,94,0.30) 0%, rgba(59,130,246,0.22) 40%, rgba(0,0,0,0) 75%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1000px]">
          <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/60">ATM Near Me</span>
          </nav>

          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
            National ATM Finder
          </p>
          <h1 className="mb-6 font-serif text-[clamp(2.5rem,7vw,4.75rem)] font-light leading-[0.92] tracking-tight">
            Find an ATM near you.
            <br />
            <span className="text-white/30">Skip empty and dead machines.</span>
          </h1>
          <p className="mb-8 max-w-[640px] text-[17px] font-light leading-relaxed text-white/50">
            Search suburb-by-suburb ATM coverage across Australia, compare major
            bank networks, and open local pages with ATM counts and nearby
            branch alternatives.
          </p>

          <HeroSearch />

          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              ["Mapped ATMs", stats.atms.toLocaleString()],
              ["Tracked Suburbs", stats.suburbs.toLocaleString()],
              ["Open Branches", stats.openBranches.toLocaleString()],
              ["Community Reports", stats.totalReports.toLocaleString()],
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
              ATM Networks
            </p>
            <h2 className="mt-3 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light text-white">
              Banks with the broadest ATM coverage
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
                      {bank.atmCount} ATMs
                    </p>
                    <p className="mt-3 text-[13px] text-white/45">
                      ATM coverage across {bank.suburbCount} suburbs.
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
              ATM Heavy Suburbs
            </p>
            <h2 className="mt-3 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light text-white">
              Places with the most nearby ATMs
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-white/5">
            {topSuburbs.map((suburb) => (
              <Link
                key={suburb.slug}
                href={`/atm/${suburb.slug}`}
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
                      {suburb.atmCount} ATMs and {suburb.branchCount} branches
                      nearby.
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
              Drill down by state or territory
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

      <section className="px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-[900px]">
          <h2 className="mb-10 font-serif text-[clamp(1.5rem,3vw,2.5rem)] font-light text-white">
            ATM Near Me FAQ
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
