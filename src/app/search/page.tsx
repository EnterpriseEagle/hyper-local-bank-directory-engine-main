import type { Metadata } from "next";
import Link from "next/link";
import { HeroSearch } from "@/components/hero-search";
import { StructuredData } from "@/components/structured-data";
import { getStateList, searchBanks, searchSuburbs } from "@/lib/data";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
  buildMetadata,
} from "@/lib/seo";
import { toTitleCase } from "@/lib/utils";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

function normalizeQuery(value?: string) {
  return (value || "").trim();
}

function formatBankTypeLabel(type: string) {
  switch (type) {
    case "big4":
      return "Big Four bank";
    case "regional":
      return "Regional & national bank";
    case "digital":
      return "Digital bank";
    case "credit_union":
      return "Mutual / credit union";
    case "international":
      return "International bank";
    default:
      return "Australian bank";
  }
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = normalizeQuery(q);

  if (query.length >= 2) {
    return buildMetadata({
      title: `Search Results for "${query}"`,
      description: `Browse bank, suburb, and postcode matches for ${query} in the BANK NEAR ME directory.`,
      path: `/search?q=${encodeURIComponent(query)}`,
      canonicalPath: "/search",
      noIndex: true,
      keywords: ["bank suburb search", "postcode bank search", "bank name search"],
    });
  }

  return buildMetadata({
    title: "Search Australian Suburbs, Postcodes and Banks",
    description:
      "Search the BANK NEAR ME directory by suburb, postcode, or bank name to find local branches, ATMs, closures, and live status pages across Australia.",
    path: "/search",
    keywords: [
      "search Australian suburbs",
      "postcode bank finder",
      "bank branch search Australia",
      "Australian bank search",
    ],
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = normalizeQuery(q);
  const hasQuery = query.length >= 2;

  const [suburbResults, bankResults, states] = await Promise.all([
    hasQuery ? searchSuburbs(query, 36) : Promise.resolve([]),
    hasQuery ? searchBanks(query, 18) : Promise.resolve([]),
    getStateList(),
  ]);
  const totalResults = suburbResults.length + bankResults.length;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Search", url: absoluteUrl("/search") },
  ]);

  const searchSchema = hasQuery
    ? {
        "@context": "https://schema.org",
        "@type": "SearchResultsPage",
        name: `Search results for ${query}`,
        url: absoluteUrl(`/search?q=${encodeURIComponent(query)}`),
        mainEntity: buildItemListSchema(
          `Directory results for ${query}`,
          [
            ...bankResults.map((bank) => ({
              name: bank.name,
              url: absoluteUrl(`/bank/${bank.slug}`),
              description: formatBankTypeLabel(bank.type),
            })),
            ...suburbResults.map((result) => ({
              name: `${toTitleCase(result.name)} ${result.postcode}`,
              url: absoluteUrl(`/${result.stateSlug}/${result.slug}`),
              description: `${result.state}`,
            })),
          ]
        ),
      }
    : buildCollectionPageSchema({
        name: "Search Australian suburbs and postcodes",
        description:
          "Search landing page for Australian suburb and postcode-based bank directory results.",
        url: absoluteUrl("/search"),
        numberOfItems: states.length,
        mainEntity: buildItemListSchema(
          "Australian state directories",
          states.map((state) => ({
            name: state.state,
            url: absoluteUrl(`/${state.stateSlug}`),
          }))
        ),
      });

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="border-b border-white/5 px-6 py-16 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-[900px]">
          <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/60">Search</span>
          </nav>

          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
            Directory Search
          </p>
          <h1 className="mb-6 font-serif text-[clamp(2.25rem,6vw,4rem)] font-light leading-[1] tracking-tight">
            Search suburbs,
            <br />
            <span className="text-white/30">postcodes and bank coverage.</span>
          </h1>
          <p className="mb-8 max-w-[620px] text-[16px] font-light leading-relaxed text-white/50">
            Enter an Australian suburb, postcode, or bank name to find local
            bank branches, ATMs, closures, and bank coverage pages.
          </p>

          <HeroSearch />
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-[1000px]">
          {hasQuery ? (
            <>
              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
                  Results
                </p>
                <h2 className="mt-3 font-serif text-[clamp(1.5rem,4vw,2.5rem)] font-light text-white">
                  {totalResults} match{totalResults === 1 ? "" : "es"} for
                  {" "}
                  <span className="text-white/40">&quot;{query}&quot;</span>
                </h2>
              </div>

              {totalResults === 0 ? (
                <div className="border border-white/10 bg-white/[0.02] p-10 text-center">
                  <p className="text-[15px] font-light text-white/50">
                    No bank, suburb, or postcode matches found for &quot;{query}&quot;.
                  </p>
                  <p className="mt-3 text-[13px] text-white/35">
                    Try a broader bank name, suburb, or postcode, or browse the
                    bank directory and state pages below.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/bank"
                      className="inline-flex items-center justify-center border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/55 transition-colors hover:border-white/20 hover:text-white"
                    >
                      Browse Banks
                    </Link>
                    <Link
                      href="/bank-near-me"
                      className="inline-flex items-center justify-center border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-white/55 transition-colors hover:border-white/20 hover:text-white"
                    >
                      Bank Near Me
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-12">
                  {bankResults.length > 0 && (
                    <div>
                      <div className="mb-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-white/30 font-medium">
                            Bank Matches
                          </p>
                          <h3 className="mt-2 text-[24px] font-light text-white">
                            Bank brands and national coverage
                          </h3>
                        </div>
                        <Link
                          href="/bank"
                          className="text-[11px] uppercase tracking-[0.16em] text-white/35 transition-colors hover:text-white"
                        >
                          Browse all banks
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
                        {bankResults.map((bank) => (
                          <Link
                            key={bank.slug}
                            href={`/bank/${bank.slug}`}
                            className="group bg-black p-6 transition-all duration-300 hover:bg-white/[0.03]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-[18px] font-light text-white group-hover:translate-x-1 transition-transform">
                                    {bank.name}
                                  </h4>
                                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white/35">
                                    Bank
                                  </span>
                                </div>
                                <p className="mt-2 text-[12px] uppercase tracking-widest text-white/30">
                                  {formatBankTypeLabel(bank.type)}
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
                  )}

                  {suburbResults.length > 0 && (
                    <div>
                      <div className="mb-5">
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/30 font-medium">
                          Area Matches
                        </p>
                        <h3 className="mt-2 text-[24px] font-light text-white">
                          Suburbs and postcodes
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
                        {suburbResults.map((result) => (
                          <Link
                            key={`${result.stateSlug}-${result.slug}`}
                            href={`/${result.stateSlug}/${result.slug}`}
                            className="group bg-black p-6 transition-all duration-300 hover:bg-white/[0.03]"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-[18px] font-light text-white group-hover:translate-x-1 transition-transform">
                                    {toTitleCase(result.name)}
                                  </h4>
                                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-white/35">
                                    Area
                                  </span>
                                </div>
                                <p className="mt-2 text-[12px] uppercase tracking-widest text-white/30">
                                  {result.postcode}, {result.state}
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
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
                  Explore
                </p>
                <h2 className="mt-3 font-serif text-[clamp(1.5rem,4vw,2.5rem)] font-light text-white">
                  Start with a state or territory
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
                {states.map((state) => (
                  <Link
                    key={state.stateSlug}
                    href={`/${state.stateSlug}`}
                    className="group bg-black p-6 transition-all duration-300 hover:bg-white/[0.03]"
                  >
                    <h3 className="text-[17px] font-light text-white group-hover:translate-x-1 transition-transform">
                      {state.state}
                    </h3>
                    <p className="mt-2 text-[12px] text-white/30">
                      {state.count} suburbs
                    </p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <StructuredData data={[breadcrumbSchema, searchSchema]} />
    </div>
  );
}
