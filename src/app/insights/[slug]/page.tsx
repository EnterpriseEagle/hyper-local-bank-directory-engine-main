import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/structured-data";
import { getAllInsights, getInsightBySlug, getInsightPageData } from "@/lib/insights";
import {
  absoluteUrl,
  buildArticleSchema,
  buildBreadcrumbSchema,
  buildFAQSchema,
  buildMetadata,
  buildWebPageSchema,
} from "@/lib/seo";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string }>;
}

function formatPublished(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function generateStaticParams() {
  return getAllInsights().map((insight) => ({ slug: insight.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const insight = getInsightBySlug(slug);

  if (!insight) {
    return { title: "Insight Not Found" };
  }

  return buildMetadata({
    title: insight.title,
    description: insight.description,
    path: `/insights/${insight.slug}`,
    keywords: insight.keywords,
    type: "article",
    category: insight.category,
    section: insight.category,
    publishedTime: insight.publishedTime,
    modifiedTime: insight.modifiedTime,
  });
}

export default async function InsightArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const insight = await getInsightPageData(slug);

  if (!insight) {
    notFound();
  }

  const pageUrl = absoluteUrl(`/insights/${insight.slug}`);

  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Insights", url: absoluteUrl("/insights") },
    { name: insight.title, url: pageUrl },
  ]);

  const webPageSchema = buildWebPageSchema({
    name: insight.title,
    description: insight.description,
    url: pageUrl,
  });

  const articleSchema = buildArticleSchema({
    headline: insight.title,
    description: insight.description,
    url: pageUrl,
    datePublished: insight.publishedTime,
    dateModified: insight.modifiedTime,
    articleSection: insight.category,
    keywords: insight.keywords,
  });

  const faqSchema = buildFAQSchema(insight.faq);

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="relative overflow-hidden border-b border-white/5 px-6 py-16 sm:px-10 sm:py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-1/2 top-1/2 h-[72vw] w-[72vw] max-h-[860px] max-w-[860px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[180px] opacity-20"
            style={{
              background:
                "radial-gradient(circle, rgba(248,113,113,0.18) 0%, rgba(59,130,246,0.18) 45%, rgba(0,0,0,0) 75%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1080px]">
          <nav className="mb-8 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/insights" className="hover:text-white transition-colors">
              Insights
            </Link>
            <span>/</span>
            <span className="text-white/60">{insight.category}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-white/30 font-medium">
                {insight.kicker}
              </p>
              <h1 className="max-w-[15ch] font-serif text-[clamp(2.4rem,7vw,5rem)] font-light leading-[0.94] tracking-tight">
                {insight.title}
              </h1>
              <p className="mt-6 max-w-[760px] text-[17px] font-light leading-relaxed text-white/50">
                {insight.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-4 text-[11px] uppercase tracking-[0.18em] text-white/25">
                <span>{formatPublished(insight.publishedTime)}</span>
                <span>{insight.readingMinutes} min read</span>
                <span>{insight.category}</span>
              </div>
            </div>

            <aside className="grid gap-px bg-white/5 self-start">
              {insight.highlights.map((highlight) => (
                <div key={highlight.label} className="bg-black p-5">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
                    {highlight.label}
                  </p>
                  <p
                    className={`mt-3 font-serif text-[1.8rem] font-light ${
                      highlight.tone === "alert"
                        ? "text-red-400"
                        : highlight.tone === "good"
                          ? "text-emerald-400"
                          : "text-white"
                    }`}
                  >
                    {highlight.value}
                  </p>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-10 sm:py-20">
        <div className="mx-auto grid max-w-[1080px] gap-16 lg:grid-cols-[minmax(0,1fr)_280px]">
          <article className="space-y-14">
            {insight.sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-light text-white">
                  {section.title}
                </h2>
                <div className="mt-6 space-y-5">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-[15px] leading-[1.85] text-white/50">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.bullets?.length ? (
                  <ul className="mt-6 grid gap-px bg-white/5">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="bg-black p-5 text-[14px] leading-relaxed text-white/55">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section className="border-t border-white/5 pt-16">
              <h2 className="font-serif text-[clamp(1.5rem,3vw,2.2rem)] font-light text-white">
                FAQ
              </h2>
              <div className="mt-8 grid gap-px bg-white/5 md:grid-cols-3">
                {insight.faq.map((item) => (
                  <div key={item.q} className="bg-black p-6">
                    <h3 className="text-[15px] font-medium text-white/90">{item.q}</h3>
                    <p className="mt-3 text-[14px] leading-relaxed text-white/45">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          </article>

          <aside className="space-y-8">
            <div className="border border-white/10 bg-white/[0.02] p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Why this exists</p>
              <p className="mt-4 text-[14px] leading-relaxed text-white/45">
                This article supports research and comparison intent, then routes
                users into the stronger local pages where the actual banking answer
                lives.
              </p>
            </div>

            <div className="border border-white/10 bg-white/[0.02] p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Related pages</p>
              <div className="mt-5 space-y-4">
                {insight.relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="group block border-b border-white/5 pb-4 last:border-b-0 last:pb-0"
                  >
                    <h3 className="text-[15px] font-light text-white transition-transform group-hover:translate-x-1">
                      {link.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/35">
                      {link.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <StructuredData
        data={[webPageSchema, articleSchema, breadcrumbSchema, faqSchema].filter(Boolean)}
      />
    </div>
  );
}
