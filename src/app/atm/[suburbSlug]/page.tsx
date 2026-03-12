
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  getAtmsForSuburb,
  getSuburbBySlug,
  STATE_NAMES 
} from "@/lib/data";
import { generateATMSEOContent } from "@/lib/seo-content";
import { StatusReporter } from "@/components/status-reporter";
import { toTitleCase } from "@/lib/utils";

interface PageProps {
  params: Promise<{ suburbSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { suburbSlug } = await params;
  const suburb = await getSuburbBySlug(suburbSlug);
  if (!suburb) return { title: "ATMs Not Found" };

  const atms = await getAtmsForSuburb(suburb.slug);
  const seo = generateATMSEOContent(toTitleCase(suburb.name), atms.length);

  return {
    title: seo.title,
    description: seo.description,
  };
}

export default async function ATMSuburbPage({ params }: PageProps) {
  const { suburbSlug } = await params;
  const suburb = await getSuburbBySlug(suburbSlug);
  if (!suburb) notFound();

  const atms = await getAtmsForSuburb(suburb.slug);
  const displayName = toTitleCase(suburb.name);
  const seo = generateATMSEOContent(displayName, atms.length);

  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="px-6 py-12 sm:py-20 border-b border-white/10">
        <div className="mx-auto max-w-[900px]">
          <nav className="mb-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/${suburb.stateSlug}`} className="hover:text-white transition-colors">{STATE_NAMES[suburb.stateSlug]}</Link>
            <span>/</span>
            <Link href={`/${suburb.stateSlug}/${suburb.slug}`} className="hover:text-white transition-colors">{displayName}</Link>
            <span>/</span>
            <span className="text-white/60">ATMs</span>
          </nav>

          <h1 className="mb-6 font-serif text-[clamp(2rem,6vw,3.5rem)] font-light leading-[1.1] tracking-tight">
            ATMs in {displayName} <br />
            <span className="text-white/30">{atms.length} Locations Found</span>
          </h1>

          <p className="max-w-[600px] text-[16px] font-light leading-relaxed text-white/50">
            {seo.intro}
          </p>
        </div>
      </section>

      <section className="px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-[900px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {atms.map((atm) => (
              <div key={atm.id} className="p-6 border border-white/10 bg-white/[0.02] rounded-sm transition-all hover:border-white/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-white/30 mb-1 block">
                      {atm.bankName}
                    </span>
                    <h3 className="text-[18px] font-light text-white">{atm.name}</h3>
                  </div>
                  <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${atm.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {atm.status}
                  </span>
                </div>
                
                <p className="text-[14px] text-white/50 font-light mb-6">{atm.address}</p>
                
                <div className="border-t border-white/5 pt-6">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-4 font-medium">
                      Report Status
                   </p>
                   <StatusReporter branchId={atm.id} suburbId={suburb.id} />
                </div>
              </div>
            ))}
          </div>

          {atms.length === 0 && (
            <div className="p-20 border border-white/5 text-center bg-white/[0.02]">
               <p className="text-white/40 font-light">No dedicated ATMs mapped in {displayName}.</p>
               <Link href={`/${suburb.stateSlug}/${suburb.slug}`} className="mt-4 inline-block text-white/60 hover:text-white underline text-sm">
                  Check bank branches in {displayName}
               </Link>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 sm:py-24 bg-black border-t border-white/5">
        <div className="mx-auto max-w-[640px]">
          <h2 className="mb-10 font-serif text-[clamp(1.5rem,3vw,2.5rem)] font-light text-white">
            ATM Information
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
    </div>
  );
}
