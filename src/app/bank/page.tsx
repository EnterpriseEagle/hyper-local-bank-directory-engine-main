
import { Metadata } from "next";
import Link from "next/link";
import { getAllBanks, getStats } from "@/lib/data";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Banks in Australia - Browse Branches & ATMs by Bank",
  description: "Browse all major and regional banks in Australia. Find branch locations, ATM status, and contact details for Commonwealth Bank, Westpac, ANZ, NAB, and more.",
  alternates: {
    canonical: `${SITE_URL}/bank`,
  },
};

export default async function BanksPage() {
  const [banks, stats] = await Promise.all([
    getAllBanks(),
    getStats(),
  ]);

  const categories = {
    big4: banks.filter(b => b.type === "big4"),
    regional: banks.filter(b => b.type === "regional"),
    digital: banks.filter(b => b.type === "digital"),
    credit_union: banks.filter(b => b.type === "credit_union"),
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="relative px-6 py-20 sm:py-32 border-b border-white/10">
        <div className="relative z-10 mx-auto max-w-[900px]">
          <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/30">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/60">Banks</span>
          </nav>

          <h1 className="mb-6 font-serif text-[clamp(2.5rem,7vw,4.5rem)] font-light leading-[0.9] tracking-tight">
            Banks in <br />
            <span className="text-white/30">Australia</span>
          </h1>

          <p className="max-w-[600px] text-[17px] font-light leading-relaxed text-white/50">
            Find branches and ATMs for all {banks.length} banks tracked on BANK NEAR ME&reg;. From the Big Four to local credit unions, we monitor service status across the country.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[900px] px-6 py-20 space-y-20">
        {/* Big 4 */}
        <div>
          <h2 className="mb-10 font-serif text-[28px] font-light text-white/40">The Big Four</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10 border border-white/10">
            {categories.big4.map((b) => (
              <Link
                key={b.slug}
                href={`/bank/${b.slug}`}
                className="group bg-black p-8 transition-all duration-500 hover:bg-white/[0.03]"
              >
                <h3 className="text-xl font-light group-hover:translate-x-1 transition-transform">{b.name}</h3>
                <p className="text-[11px] text-white/30 uppercase tracking-widest mt-2">View all branches &rarr;</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Regional */}
        <div>
          <h2 className="mb-10 font-serif text-[28px] font-light text-white/40">Regional & National</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
            {categories.regional.map((b) => (
              <Link
                key={b.slug}
                href={`/bank/${b.slug}`}
                className="group bg-black p-6 transition-all duration-500 hover:bg-white/[0.03]"
              >
                <h3 className="text-[16px] font-light group-hover:translate-x-1 transition-transform">{b.name}</h3>
              </Link>
            ))}
          </div>
        </div>

        {/* Digital */}
        <div>
          <h2 className="mb-10 font-serif text-[28px] font-light text-white/40">Digital Banks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
            {categories.digital.map((b) => (
              <Link
                key={b.slug}
                href={`/bank/${b.slug}`}
                className="group bg-black p-6 transition-all duration-500 hover:bg-white/[0.03]"
              >
                <h3 className="text-[16px] font-light group-hover:translate-x-1 transition-transform">{b.name}</h3>
                <p className="text-[10px] text-white/20 mt-1">Digital only network</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
      
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Banks in Australia",
            "itemListElement": banks.map((b, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "url": `${SITE_URL}/bank/${b.slug}`,
              "name": b.name
            }))
          }),
        }}
      />
    </div>
  );
}
