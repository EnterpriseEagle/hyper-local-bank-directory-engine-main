
import { Metadata } from "next";
import Link from "next/link";
import { getRecentClosures, getTopClosureSuburbs, getStats } from "@/lib/data";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { StructuredData } from "@/components/structured-data";
import { SwitchOfferCard } from "@/components/switch-banner";
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

const currentYear = new Date().getFullYear();

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export const metadata: Metadata = buildMetadata({
  title: `Bank Branch Closures Australia ${currentYear} - Live Tracker`,
  description:
    "Track the latest bank branch closures across Australia. See which suburbs are losing branches, compare local impact, and find the nearest open banking alternatives.",
  path: "/closures",
  imagePath: "/closures/opengraph-image",
  keywords: [
    "bank branch closures Australia",
    "Australian bank closures tracker",
    "bank branch shutdowns Australia",
    "local bank closure data",
  ],
});

export default async function ClosuresPage() {
  const [recentClosures, topSuburbs, stats] = await Promise.all([
    getRecentClosures(50),
    getTopClosureSuburbs(20),
    getStats(),
  ]);
  const faq = [
    {
      q: "How current is the bank closures tracker?",
      a: "The closures page is refreshed from the latest mapped branch records and links directly to local suburb pages where you can check remaining branches and ATMs.",
    },
    {
      q: "Which suburbs are most affected by branch closures?",
      a: "Use the most impacted suburb list to see where closures are concentrated, then open each suburb page for alternative branches, ATM access, and live status reports.",
    },
    {
      q: "Where can I find nearby banking alternatives after a closure?",
      a: "Every closure entry links to a suburb page where you can compare remaining branches, ATMs, and recent local service updates before travelling.",
    },
  ];
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Closures", url: absoluteUrl("/closures") },
  ]);
  const collectionSchema = buildCollectionPageSchema({
    name: `Bank branch closures Australia ${currentYear}`,
    description: "Live tracker for Australian bank branch closures and suburb-level impact.",
    url: absoluteUrl("/closures"),
    numberOfItems: recentClosures.length,
  });
  const webPageSchema = buildWebPageSchema({
    name: `Bank Branch Closures Australia ${currentYear}`,
    description:
      "Live closure tracker for Australian bank branches, impacted suburbs, and nearby alternatives.",
    url: absoluteUrl("/closures"),
  });
  const closureListSchema = buildItemListSchema(
    "Recent Australian bank branch closures",
    recentClosures.slice(0, 25).map((closure) => ({
      name: closure.branchName,
      url: absoluteUrl(`/${closure.stateSlug}/${closure.suburbSlug}`),
      description: `${closure.suburbName}, ${closure.state} ${closure.postcode}`,
    }))
  );
  const faqSchema = buildFAQSchema(faq);
  const closureSlides = chunkItems(recentClosures, 4);

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
            <span className="text-white/30">Australia {currentYear}</span>
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
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif text-[28px] font-light">Recent Closures</h2>
              <p className="mt-3 max-w-[42rem] text-[14px] leading-relaxed text-white/40">
                Browse the latest {recentClosures.length} closure records without
                scrolling through a giant wall of cards. Each slide groups the
                newest impacted branches into a tighter, easier-to-scan layout.
              </p>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
              Swipe or use arrows
            </p>
          </div>

          <Carousel
            opts={{ align: "start" }}
            className="border border-white/5 bg-white/[0.02] px-4 pb-4 pt-[4.5rem] sm:px-6 sm:pb-6 sm:pt-20"
          >
            <CarouselContent>
              {closureSlides.map((slide, slideIndex) => (
                <CarouselItem key={`closure-slide-${slideIndex}`}>
                  <div className="grid grid-cols-1 gap-px bg-white/5 md:grid-cols-2">
                    {slide.map((closure) => (
                      <Link
                        key={`${closure.stateSlug}-${closure.suburbSlug}-${closure.branchName}`}
                        href={`/${closure.stateSlug}/${closure.suburbSlug}`}
                        className="group bg-black p-5 transition-colors hover:bg-white/[0.03]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-red-400/65">
                              {closure.state}
                            </p>
                            <h3 className="mt-3 text-[16px] font-medium leading-snug text-white transition-colors group-hover:text-red-400">
                              {closure.branchName}
                            </h3>
                            <p className="mt-2 text-[13px] leading-relaxed text-white/40">
                              {toTitleCase(closure.suburbName)}, {closure.state} {closure.postcode}
                            </p>
                          </div>
                          <span className="text-white/15 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white/45">
                            &rarr;
                          </span>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                            Closed
                          </span>
                          <span className="border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/60">
                            {closure.closedDate || "Recently"}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-white/20">
                            View alternatives
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious className="left-auto right-16 top-6 translate-y-0 border-white/10 bg-black text-white hover:bg-white hover:text-black disabled:border-white/5 disabled:bg-black disabled:text-white/15" />
            <CarouselNext className="right-6 top-6 translate-y-0 border-white/10 bg-black text-white hover:bg-white hover:text-black disabled:border-white/5 disabled:bg-black disabled:text-white/15" />
          </Carousel>
        </div>

        {/* Sidebar */}
        <div className="space-y-10">
          <div className="border border-white/5 bg-white/[0.02]">
            <div className="border-b border-white/5 px-6 py-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-serif text-[24px] font-light">Most Impacted</h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/40">
                    The top {topSuburbs.length} suburbs with the heaviest closure concentration.
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                  Scroll list
                </span>
              </div>
            </div>

            <div className="max-h-[34rem] overflow-y-auto p-2 sm:p-3">
              <div className="grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-1">
                {topSuburbs.map((s, i) => (
                  <Link
                    key={i}
                    href={`/${s.stateSlug}/${s.slug}`}
                    className="group bg-black p-4 transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                          {s.state}
                        </p>
                        <h3 className="mt-2 text-[15px] font-light text-white transition-colors group-hover:text-red-400">
                          {toTitleCase(s.name)}
                        </h3>
                        <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/30">
                          {s.postcode}
                        </p>
                      </div>
                      <span className="font-serif text-[13px] font-light text-red-400/80">
                        {s.closedBranches}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
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

      <section className="border-t border-white/5 px-6 py-16 sm:px-10 sm:py-20 bg-black">
        <div className="mx-auto max-w-[900px]">
          <h2 className="mb-10 font-serif text-[clamp(1.5rem,3vw,2.5rem)] font-light text-white">
            Closures FAQ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
            {faq.map((item) => (
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
        data={[
          webPageSchema,
          collectionSchema,
          breadcrumbSchema,
          closureListSchema,
          faqSchema,
        ].filter(Boolean)}
      />
    </div>
  );
}
