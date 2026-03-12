import type { Metadata } from "next";
import Link from "next/link";
import { StructuredData } from "@/components/structured-data";
import { getStats } from "@/lib/data";
import { getAllInsights } from "@/lib/insights";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
  buildMetadata,
  buildWebPageSchema,
} from "@/lib/seo";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Banking Insights Australia | Closures, ATM Access and Bank Near Me Guides",
  description:
    "Data-backed banking insights for Australia covering branch closures, ATM access, bank coverage, and how to find a working bank near you.",
  path: "/insights",
  imagePath: "/insights/opengraph-image",
  keywords: [
    "banking insights Australia",
    "bank branch closures Australia guide",
    "ATM access Australia guide",
    "bank near me Australia guide",
  ],
});

function formatPublished(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function InsightsPage() {
  const [stats] = await Promise.all([getStats()]);
  const insights = getAllInsights();

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Insights", url: absoluteUrl("/insights") },
  ]);

  const webPageSchema = buildWebPageSchema({
    name: "BANK NEAR ME insights hub",
    description:
      "Editorial hub for data-backed Australian bank branch, ATM, closure, and access insights.",
    url: absoluteUrl("/insights"),
  });

  const collectionSchema = buildCollectionPageSchema({
    name: "Australian banking insights",
    description:
      "Index of data-backed guides covering closures, ATM access, bank coverage, and live local banking access in Australia.",
    url: absoluteUrl("/insights"),
    numberOfItems: insights.length,
    mainEntity: buildItemListSchema(
      "BANK NEAR ME insights articles",
      insights.map((insight) => ({
        name: insight.title,
        url: absoluteUrl(`/insights/${insight.slug}`),
        description: insight.description,
      }))
    ),
  });

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="relative overflow-hidden border-b border-white/5 px-6 py-16 sm:px-10 sm:py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-1/2 h-[75vw] w-[75vw] max-h-[900px] max-w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[180px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(248,113,113,0.20) 0%, rgba(59,130,246,0.20) 45%, rgba(0,0,0,0) 75%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1050px]">
          <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/60">Insights</span>
          </nav>

          <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
            Editorial Intelligence
          </p>
          <h1 className="mb-6 font-serif text-[clamp(2.5rem,7vw,4.75rem)] font-light leading-[0.92] tracking-tight">
            Not blog fluff.
            <br />
            <span className="text-white/30">Real search-supporting banking guides.</span>
          </h1>
          <p className="mb-8 max-w-[720px] text-[17px] font-light leading-relaxed text-white/50">
            These insight pages are built to support the exact commercial and local
            intent behind BANK NEAR ME. They turn live branch, ATM, closure, and
            community-report data into indexable editorial pages that push readers
            into the strongest local answers.
          </p>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              ["Articles", insights.length.toString()],
              ["Tracked Suburbs", stats.suburbs.toLocaleString()],
              ["Open Branches", stats.openBranches.toLocaleString()],
              ["Mapped ATMs", stats.atms.toLocaleString()],
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

      <section className="px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto max-w-[1100px]">
          <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
              Articles
            </p>
            <h2 className="mt-3 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light text-white">
              High-intent guides built around what people actually search
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-px bg-white/5 lg:grid-cols-2">
            {insights.map((insight) => (
              <Link
                key={insight.slug}
                href={`/insights/${insight.slug}`}
                className="group bg-black p-8 transition-all duration-300 hover:bg-white/[0.03]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                      {insight.category}
                    </p>
                    <h3 className="mt-4 font-serif text-[1.65rem] font-light leading-[1.1] text-white transition-transform group-hover:translate-x-1">
                      {insight.title}
                    </h3>
                    <p className="mt-4 max-w-[34rem] text-[14px] leading-relaxed text-white/45">
                      {insight.excerpt}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4 text-[11px] uppercase tracking-[0.18em] text-white/25">
                      <span>{formatPublished(insight.publishedTime)}</span>
                      <span>{insight.readingMinutes} min read</span>
                    </div>
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

      <section className="border-t border-white/5 px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto grid max-w-[1100px] gap-px bg-white/5 md:grid-cols-3">
          {[
            {
              title: "Support the money pages",
              text: "Each article is built to feed users into suburb pages, bank pages, ATM pages, and closure hubs instead of competing with them.",
            },
            {
              title: "Use real data",
              text: "The content angle comes from your own mapped coverage, closure counts, and community reports rather than generic finance copy.",
            },
            {
              title: "Rank for adjacent intent",
              text: "These pages target research and comparison queries that sit one step before the local conversion click.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-black p-6">
              <h3 className="text-[15px] font-medium text-white/90">{item.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-white/45">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <StructuredData data={[webPageSchema, collectionSchema, breadcrumbSchema]} />
    </div>
  );
}
