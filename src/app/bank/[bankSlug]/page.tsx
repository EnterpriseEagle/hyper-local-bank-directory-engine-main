
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/structured-data";
import { 
  getBankBySlug, 
  getBankBranchStats, 
  getBankStatesPresence,
  STATE_NAMES 
} from "@/lib/data";
import { generateBankSEOContent } from "@/lib/seo-content";
import { SwitchOfferCard } from "@/components/switch-banner";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQSchema,
  buildItemListSchema,
  buildMetadata,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ bankSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bankSlug } = await params;
  const bank = await getBankBySlug(bankSlug);
  if (!bank) return { title: "Bank Not Found" };

  const stats = await getBankBranchStats(bank.id);
  const seo = generateBankSEOContent(bank.name, "Australia", "national", stats);

  return buildMetadata({
    title: seo.title,
    description: seo.description,
    path: `/bank/${bank.slug}`,
    keywords: [
      `${bank.name} branches`,
      `${bank.name} ATMs`,
      `${bank.name} Australia`,
      `${bank.name} closures`,
    ],
  });
}

export default async function BankPage({ params }: PageProps) {
  const { bankSlug } = await params;
  const bank = await getBankBySlug(bankSlug);
  if (!bank) notFound();

  const [stats, states] = await Promise.all([
    getBankBranchStats(bank.id),
    getBankStatesPresence(bank.id),
  ]);

  const seo = generateBankSEOContent(bank.name, "Australia", "national", stats);
  const pageUrl = absoluteUrl(`/bank/${bank.slug}`);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Banks", url: absoluteUrl("/bank") },
    { name: bank.name, url: pageUrl },
  ]);
  const collectionSchema = buildCollectionPageSchema({
    name: `${bank.name} branches and ATMs in Australia`,
    description: seo.description,
    url: pageUrl,
    numberOfItems: states.length,
    about: {
      "@type": "BankOrCreditUnion",
      name: bank.name,
      url: bank.website || pageUrl,
    },
  });
  const stateListSchema = buildItemListSchema(
    `${bank.name} state coverage`,
    states.map((state) => ({
      name: STATE_NAMES[state.stateSlug] || state.state,
      url: absoluteUrl(`/bank/${bank.slug}/${state.stateSlug}`),
      description: `${state.branchCount} branches and ${state.atmCount} ATMs`,
    }))
  );
  const bankSchema = {
    "@context": "https://schema.org",
    "@type": "BankOrCreditUnion",
    name: bank.name,
    url: bank.website || pageUrl,
    mainEntityOfPage: pageUrl,
    description: seo.description,
    areaServed: {
      "@type": "Country",
      name: "Australia",
    },
  };
  const faqSchema = buildFAQSchema(seo.faq);

  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="relative px-6 py-16 sm:py-24 border-b border-white/10">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
           <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full blur-[150px]"
            style={{
              background: "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(0,0,0,0) 70%)",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[900px]">
          <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/60">Banks</span>
          </nav>

          <h1 className="mb-6 font-serif text-[clamp(2.5rem,7vw,4.5rem)] font-light leading-[0.9] tracking-tight">
            {bank.name} <br />
            <span className="text-white/30">Branches & ATMs</span>
          </h1>

          <p className="mb-10 max-w-[600px] text-[17px] font-light leading-relaxed text-white/50">
            {seo.intro}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-12 border-t border-white/10 pt-10">
            <div>
              <div className="text-[clamp(1.5rem,3vw,2.5rem)] font-serif font-light text-white">
                {stats.openBranches.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                Open Branches
              </div>
            </div>
            <div>
              <div className="text-[clamp(1.5rem,3vw,2.5rem)] font-serif font-light text-white">
                {stats.atms.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                ATM Locations
              </div>
            </div>
            <div>
              <div className="text-[clamp(1.5rem,3vw,2.5rem)] font-serif font-light text-red-400">
                {stats.closedBranches.toLocaleString()}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                Recent Closures
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monetization */}
      <SwitchOfferCard closedBranches={stats.closedBranches} />

      {/* State Selection */}
      <section className="px-6 py-16 sm:py-24 border-b border-white/5">
        <div className="mx-auto max-w-[900px]">
          <h2 className="mb-12 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light text-white">
            Find {bank.name} by State
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10">
            {states.map((s) => (
              <Link
                key={s.stateSlug}
                href={`/bank/${bankSlug}/${s.stateSlug}`}
                className="group bg-black p-8 transition-all duration-500 hover:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif text-[20px] font-light text-white transition-all duration-300 group-hover:translate-x-1">
                    {STATE_NAMES[s.stateSlug] || s.state}
                  </h3>
                  <span className="text-white/20 group-hover:text-white/50 transition-colors">&rarr;</span>
                </div>
                <div className="flex gap-4 text-[11px] text-white/40 uppercase tracking-wider">
                  <span>{s.branchCount} Branches</span>
                  <span className="w-px h-3 bg-white/10 mt-0.5" />
                  <span>{s.atmCount} ATMs</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ / Content */}
      <section className="px-6 py-16 sm:py-24 bg-black">
        <div className="mx-auto max-w-[640px]">
          <h2 className="mb-10 font-serif text-[clamp(1.5rem,3vw,2.5rem)] font-light text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-12">
            {seo.faq.map((item, i) => (
              <div key={i}>
                <h3 className="text-[17px] font-medium text-white/90 mb-3">{item.q}</h3>
                <p className="text-[15px] font-light leading-relaxed text-white/50">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StructuredData
        data={[collectionSchema, breadcrumbSchema, stateListSchema, bankSchema, faqSchema].filter(Boolean)}
      />
    </div>
  );
}
