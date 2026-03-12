import { getActiveOffer } from "@/lib/affiliate-offers";
import { AffiliateLink } from "@/components/affiliate-link";
import { affiliateFeaturesEnabled } from "@/lib/feature-flags";

/**
 * Full-width "deny" card for the homepage.
 * Pulls the highest-priority active affiliate offer.
 */
export function SwitchOfferCard({ closedBranches }: { closedBranches: number }) {
  if (!affiliateFeaturesEnabled) {
    return null;
  }

  const offer = getActiveOffer();

      return (
        <section className="relative border-b border-white/5 px-6 sm:px-10 py-10 sm:py-14 bg-black overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vw] max-w-[800px] max-h-[500px] rounded-full blur-[150px] opacity-10"
          style={{
            background: `radial-gradient(circle, ${offer.theme.glowColor} 0%, rgba(0,0,0,0) 70%)`,
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1000px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
          {/* Left: The pitch */}
          <div>
            <p className={`mb-3 text-[10px] uppercase tracking-[0.2em] ${offer.theme.accent} opacity-50 font-medium`}>
              Switch &amp; Save
            </p>
            <h2 className="mb-3 font-serif text-[clamp(1.5rem,3.5vw,2.25rem)] font-light leading-[1.1] text-white">
              Tired of empty ATMs
              <br />
              <span className="text-white/35">and closed branches?</span>
            </h2>
            <p className="text-[15px] font-light leading-[1.7] text-white/40 max-w-[440px]">
              The Big Four are closing {closedBranches.toLocaleString()} branches
              and counting. Stop hoping your ATM has cash. Switch to a bank that
              actually works for you.
            </p>
          </div>

          {/* Right: The offer card */}
          <div className="border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className={`h-8 w-8 ${offer.theme.accentBg} flex items-center justify-center`}>
                <span className={`${offer.theme.accent} text-sm`}>★</span>
              </div>
              <div>
                <p className="text-[14px] font-medium text-white">{offer.brand} &mdash; {offer.tagline}</p>
                <p className="text-[11px] text-white/30">{offer.badge}</p>
              </div>
            </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
              {offer.stats.map((item) => (
                <div key={item.label} className="text-center py-3 bg-white/[0.03]">
                  <div className={`text-[clamp(1.25rem,2vw,1.5rem)] font-serif font-light ${offer.theme.accent}`}>
                    {item.value}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.15em] text-white/30 mt-1">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <AffiliateLink
                href={offer.url}
                offerId={offer.id}
                placement="homepage-card"
                className={`block w-full py-4 ${offer.theme.buttonBg} ${offer.theme.buttonText} text-[11px] uppercase tracking-[0.2em] font-semibold ${offer.theme.buttonHover} transition-colors duration-300 text-center`}
              >
                {offer.cta} &rarr;
              </AffiliateLink>
            <p className="text-[10px] text-white/50 text-center mt-3">
              {offer.finePrint}
            </p>
          </div>
        </div>

        {/* ASIC disclosure */}
        <p className="text-[10px] text-white/15 mt-8 max-w-[600px]">
          We may earn a commission if you switch via our links. This does not affect
          our ratings or the order in which products appear. All information is general
          in nature and does not constitute financial advice.
        </p>
      </div>
    </section>
  );
}

/**
 * Sticky bottom bar for suburb pages.
 * Contextual with the suburb name.
 */
export function SwitchStickyBar({ suburbName, suburbSlug, stateSlug }: { suburbName: string; suburbSlug?: string; stateSlug?: string }) {
  if (!affiliateFeaturesEnabled) {
    return null;
  }

  const offer = getActiveOffer();

  // Build contextual CTA text based on offer
  const isING = offer.id === "ing-125";
  const bonusText = isING ? "$125 bonus" : "$30 bonus";

  return (
    <div className="sticky bottom-0 z-40 border-t border-white/10 bg-black/95 backdrop-blur-sm">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[13px] font-light text-white/60 text-center sm:text-left">
          Tired of broken ATMs in{" "}
          <span className="text-white font-normal">{suburbName}</span>?{" "}
          <span className={`${offer.theme.accent} opacity-80`}>
            Switch to {offer.brand} &mdash; {bonusText} + 100% fee rebates.
          </span>
        </p>
          <AffiliateLink
            href={offer.url}
            offerId={offer.id}
            placement="suburb-sticky"
            suburbSlug={suburbSlug}
            stateSlug={stateSlug}
            className={`shrink-0 ${offer.theme.buttonBg} ${offer.theme.buttonText} px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] font-semibold ${offer.theme.buttonHover} transition-all duration-300`}
          >
            {offer.cta} &rarr;
          </AffiliateLink>
      </div>
      <p className="text-[9px] text-white/10 text-center pb-2 px-6">
        We may earn a commission if you switch via our links. Not financial advice.
      </p>
    </div>
  );
}
