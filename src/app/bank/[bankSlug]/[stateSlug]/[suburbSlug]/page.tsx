
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StructuredData } from "@/components/structured-data";
import { TripPlanCard } from "@/components/trip-plan-card";
import {
  getBankBySlug,
  getBankBranchesInSuburb,
  getRecentReportsForBranchIds,
  getSuburbBySlugInState,
  STATE_NAMES,
} from "@/lib/data";
import { generateBankSEOContent } from "@/lib/seo-content";
import { StatusReporter } from "@/components/status-reporter";
import { VisitAdvisoryCard } from "@/components/visit-advisory";
import {
  absoluteUrl,
  buildBreadcrumbSchema,
  buildCollectionPageSchema,
  buildFAQSchema,
  buildItemListSchema,
  buildMetadata,
} from "@/lib/seo";
import { buildTripPlan } from "@/lib/trip-plan";
import { toTitleCase } from "@/lib/utils";
import { buildVisitAdvisory } from "@/lib/visit-advisory";
import {
  listApprovedCommunityIncidentSummaries,
  supabaseReportsConfigured,
} from "@/lib/reports/supabase";

interface PageProps {
  params: Promise<{ bankSlug: string; stateSlug: string; suburbSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bankSlug, stateSlug, suburbSlug } = await params;
  const [bank, suburb] = await Promise.all([
    getBankBySlug(bankSlug),
    getSuburbBySlugInState(suburbSlug, stateSlug)
  ]);
  
  if (!bank || !suburb) return { title: "Not Found" };

  const branches = await getBankBranchesInSuburb(bank.id, suburb.slug);
  const openBranches = branches.filter(b => b.type === 'branch' && b.status === 'open').length;
  const atms = branches.filter(b => b.type === 'atm').length;
  const closedBranches = branches.filter(b => b.status === 'closed').length;

  const seo = generateBankSEOContent(bank.name, toTitleCase(suburb.name), "suburb", { openBranches, atms, closedBranches });

  return buildMetadata({
    title: seo.title,
    description: seo.description,
    path: `/bank/${bank.slug}/${stateSlug}/${suburb.slug}`,
    keywords: [
      `${bank.name} ${toTitleCase(suburb.name)}`,
      `${bank.name} ${toTitleCase(suburb.name)} branch`,
      `${bank.name} ${toTitleCase(suburb.name)} ATM`,
    ],
  });
}

export default async function BankSuburbPage({ params }: PageProps) {
  const { bankSlug, stateSlug, suburbSlug } = await params;
  const [bank, suburb] = await Promise.all([
    getBankBySlug(bankSlug),
    getSuburbBySlugInState(suburbSlug, stateSlug)
  ]);

  if (!bank || !suburb || suburb.stateSlug !== stateSlug) notFound();

  const displayName = toTitleCase(suburb.name);
  const branches = await getBankBranchesInSuburb(bank.id, suburb.slug);
  const [recentReports, approvedIncidents] = await Promise.all([
    getRecentReportsForBranchIds(
      branches.map((branch) => branch.id),
      12
    ),
    supabaseReportsConfigured()
      ? listApprovedCommunityIncidentSummaries({
          branchIds: branches.map((branch) => branch.id),
          limit: 8,
        })
      : Promise.resolve([]),
  ]);
  const openBranchesCount = branches.filter(b => b.type === 'branch' && b.status === 'open').length;
  const atmsCount = branches.filter(b => b.type === 'atm').length;
  const closedCount = branches.filter(b => b.status === 'closed').length;

  const seo = generateBankSEOContent(bank.name, toTitleCase(suburb.name), "suburb", { 
    openBranches: openBranchesCount, 
    atms: atmsCount, 
    closedBranches: closedCount 
  });
  const pageUrl = absoluteUrl(`/bank/${bank.slug}/${stateSlug}/${suburb.slug}`);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: "Home", url: absoluteUrl("/") },
    { name: "Banks", url: absoluteUrl("/bank") },
    { name: bank.name, url: absoluteUrl(`/bank/${bank.slug}`) },
    { name: STATE_NAMES[stateSlug], url: absoluteUrl(`/bank/${bank.slug}/${stateSlug}`) },
    { name: displayName, url: pageUrl },
  ]);
  const collectionSchema = buildCollectionPageSchema({
    name: `${bank.name} in ${displayName}`,
    description: seo.description,
    url: pageUrl,
    numberOfItems: branches.length,
    about: {
      "@type": "Place",
      name: `${displayName}, ${suburb.state} ${suburb.postcode}`,
      geo: {
        "@type": "GeoCoordinates",
        latitude: suburb.lat,
        longitude: suburb.lng,
      },
    },
  });
  const locationListSchema = buildItemListSchema(
    `${bank.name} locations in ${displayName}`,
    branches.slice(0, 20).map((branch) => ({
      name: branch.name,
      url: pageUrl,
      description: branch.address,
    }))
  );
  const faqSchema = buildFAQSchema(seo.faq);
  const branchSchemas = branches
    .filter((branch) => branch.type === "branch")
    .slice(0, 20)
    .map((branch) => ({
    "@context": "https://schema.org",
    "@type": "BankOrCreditUnion",
    name: branch.name,
    branchCode: branch.bsb || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: branch.address,
      addressLocality: displayName,
      addressRegion: suburb.state,
      postalCode: suburb.postcode,
      addressCountry: "AU",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: branch.lat,
      longitude: branch.lng,
    },
    parentOrganization: {
      "@type": "BankOrCreditUnion",
      name: bank.name,
      url: absoluteUrl(`/bank/${bank.slug}`),
    },
  }));
  const bankAdvisory = buildVisitAdvisory({
    scope: "bank",
    placeLabel: `${bank.name} in ${displayName}`,
    openLocations: branches.filter((branch) => branch.status === "open").length,
    closedLocations: closedCount,
    fallbackLocations: Math.max(branches.length - 1, 0),
    recentReports,
  });
  const tripPlan = buildTripPlan({
    incidents: approvedIncidents,
    locations: branches.map((branch) => ({
      address: branch.address,
      feeRating: branch.feeRating,
      id: branch.id,
      name: branch.name,
      openingHours: branch.openingHours,
      status: branch.status,
      type: branch.type as "branch" | "atm",
    })),
    placeLabel: `${bank.name} in ${displayName}`,
    scope: "bank",
  });

  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="px-6 py-12 sm:py-20 border-b border-white/10">
        <div className="mx-auto max-w-[900px]">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/bank/${bankSlug}`} className="hover:text-white transition-colors">{bank.name}</Link>
            <span>/</span>
            <Link href={`/bank/${bankSlug}/${stateSlug}`} className="hover:text-white transition-colors">{STATE_NAMES[stateSlug]}</Link>
            <span>/</span>
            <span className="text-white/60">{displayName}</span>
          </nav>

          <h1 className="mb-6 font-serif text-[clamp(2rem,6vw,3.5rem)] font-light leading-[1.1] tracking-tight">
            {bank.name} in {displayName} <br />
            <span className="text-white/30">{suburb.postcode}, {suburb.state}</span>
          </h1>

          <p className="max-w-[600px] text-[16px] font-light leading-relaxed text-white/50">
            {seo.intro}
          </p>
        </div>
      </section>

      <section className="border-b border-white/10 px-6 py-10 sm:px-10 sm:py-12">
        <div className="mx-auto max-w-[900px]">
          <VisitAdvisoryCard advisory={bankAdvisory} evidenceLabel="Before You Visit This Bank" />
        </div>
      </section>

      {tripPlan && (
        <section className="border-b border-white/10 px-6 py-10 sm:px-10 sm:py-12">
          <div className="mx-auto max-w-[900px]">
            <TripPlanCard eyebrow="Bank Visit Plan" plan={tripPlan} />
          </div>
        </section>
      )}

      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-[900px]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* List of branches/ATMs */}
            <div className="lg:col-span-2 space-y-8">
              <h2 className="font-serif text-[24px] font-light mb-6 border-b border-white/10 pb-4">
                Active Locations
              </h2>
              
              {branches.length === 0 ? (
                <div className="p-10 border border-white/5 text-center bg-white/[0.02]">
                  <p className="text-white/40 font-light">No {bank.name} locations found in {displayName}.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {branches.map((b) => (
                    <div key={b.id} className="p-6 border border-white/10 bg-white/[0.02] rounded-sm group transition-all hover:border-white/20">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${b.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {b.status}
                            </span>
                            <span className="text-[10px] uppercase tracking-widest text-white/30">
                              {b.type}
                            </span>
                          </div>
                          <h3 className="text-[19px] font-light text-white">{b.name}</h3>
                        </div>
                        <Link 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
                          target="_blank"
                          className="text-[11px] text-white/40 hover:text-white transition-colors uppercase tracking-widest border-b border-white/10"
                        >
                          Directions &rarr;
                        </Link>
                      </div>
                      
                      <p className="text-[14px] text-white/50 font-light mb-4">{b.address}</p>
                      
                      {b.openingHours && (
                        <p className="text-[12px] text-white/30">
                          Hours: {b.openingHours}
                        </p>
                      )}

                      {/* Status Reporter Integration */}
                      <div className="mt-8 border-t border-white/5 pt-6">
                         <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4 font-medium">
                            Report Live Status
                         </p>
                         <StatusReporter branchId={b.id} branchType="branch" suburbId={suburb.id} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar with reports and error reporting */}
            <div className="space-y-12">
               <div className="p-6 border border-red-500/20 bg-red-500/[0.02]">
                  <h3 className="font-serif text-[18px] font-light text-red-400 mb-4">
                     Report a Closure
                  </h3>
                  <p className="text-[13px] text-white/40 font-light mb-6">
                     Did this {bank.name} branch close permanently? Help the community by reporting it.
                  </p>
                  <Link
                    href={`/${stateSlug}/${suburb.slug}`}
                    className="block w-full py-3 text-center text-[11px] uppercase tracking-[0.2em] font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/[0.05] transition-colors"
                  >
                    Report via Status Reporter &rarr;
                  </Link>
               </div>

               <div className="p-6 border border-white/10 bg-white/[0.02]">
                  <h3 className="font-serif text-[18px] font-light text-white mb-4">
                     Nearby {displayName}
                  </h3>
                  <div className="space-y-4">
                     <Link href={`/${stateSlug}/${suburb.slug}`} className="block text-[14px] text-white/50 hover:text-white transition-colors">
                        All Banks in {displayName} &rarr;
                     </Link>
                     <Link href={`/atm/${suburb.slug}`} className="block text-[14px] text-white/50 hover:text-white transition-colors">
                        ATMs in {displayName} &rarr;
                     </Link>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / Content */}
      <section className="px-6 py-16 sm:py-24 bg-black border-t border-white/5">
        <div className="mx-auto max-w-[640px]">
          <h2 className="mb-10 font-serif text-[clamp(1.5rem,3vw,2.5rem)] font-light text-white">
            Helpful Information
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
        data={[collectionSchema, breadcrumbSchema, locationListSchema, faqSchema, ...branchSchemas].filter(Boolean)}
      />
    </div>
  );
}
