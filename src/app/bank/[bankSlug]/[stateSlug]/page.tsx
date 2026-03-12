
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { 
  getBankBySlug, 
  getBankSuburbsInState,
  STATE_NAMES 
} from "@/lib/data";
import { generateBankSEOContent } from "@/lib/seo-content";
import { SwitchOfferCard } from "@/components/switch-banner";

interface PageProps {
  params: Promise<{ bankSlug: string; stateSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { bankSlug, stateSlug } = await params;
  const bank = await getBankBySlug(bankSlug);
  const stateName = STATE_NAMES[stateSlug];
  if (!bank || !stateName) return { title: "Not Found" };

  const suburbs = await getBankSuburbsInState(bank.id, stateSlug);
  const openBranches = suburbs.reduce((acc, s) => acc + s.branchCount, 0);
  const atms = suburbs.reduce((acc, s) => acc + s.atmCount, 0);
  const closedBranches = suburbs.reduce((acc, s) => acc + s.closedCount, 0);

  const seo = generateBankSEOContent(bank.name, stateName, "state", { openBranches, atms, closedBranches });

  return {
    title: seo.title,
    description: seo.description,
  };
}

export default async function BankStatePage({ params }: PageProps) {
  const { bankSlug, stateSlug } = await params;
  const bank = await getBankBySlug(bankSlug);
  const stateName = STATE_NAMES[stateSlug];
  if (!bank || !stateName) notFound();

  const suburbs = await getBankSuburbsInState(bank.id, stateSlug);
  const openBranches = suburbs.reduce((acc, s) => acc + s.branchCount, 0);
  const atms = suburbs.reduce((acc, s) => acc + s.atmCount, 0);
  const closedBranches = suburbs.reduce((acc, s) => acc + s.closedCount, 0);

  const seo = generateBankSEOContent(bank.name, stateName, "state", { openBranches, atms, closedBranches });

  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="relative px-6 py-16 sm:py-24 border-b border-white/10">
        <div className="relative z-10 mx-auto max-w-[900px]">
          <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/bank/${bankSlug}`} className="hover:text-white transition-colors">{bank.name}</Link>
            <span>/</span>
            <span className="text-white/60">{stateName}</span>
          </nav>

          <h1 className="mb-6 font-serif text-[clamp(2.5rem,7vw,4.5rem)] font-light leading-[0.9] tracking-tight">
            {bank.name} <br />
            <span className="text-white/30">{stateName} Locations</span>
          </h1>

          <p className="mb-10 max-w-[600px] text-[17px] font-light leading-relaxed text-white/50">
            {seo.intro}
          </p>

          <div className="flex gap-12 border-t border-white/10 pt-10">
            <div>
              <div className="text-[clamp(1.5rem,3vw,2.5rem)] font-serif font-light text-white">
                {openBranches}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                Open Branches
              </div>
            </div>
            <div>
              <div className="text-[clamp(1.5rem,3vw,2.5rem)] font-serif font-light text-white">
                {atms}
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mt-1">
                ATM Locations
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Monetization */}
      <SwitchOfferCard closedBranches={closedBranches} />

      {/* Suburb Selection */}
      <section className="px-6 py-16 sm:py-24 border-b border-white/5">
        <div className="mx-auto max-w-[900px]">
          <h2 className="mb-12 font-serif text-[clamp(1.75rem,4vw,3rem)] font-light text-white">
            {bank.name} Suburbs in {stateName}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            {suburbs.map((s) => (
              <Link
                key={s.suburbSlug}
                href={`/bank/${bankSlug}/${stateSlug}/${s.suburbSlug}`}
                className="group bg-black p-6 transition-all duration-500 hover:bg-white/[0.03]"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-serif text-[18px] font-light text-white transition-all duration-300 group-hover:translate-x-1">
                    {s.suburbName}
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
            Common Questions
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
