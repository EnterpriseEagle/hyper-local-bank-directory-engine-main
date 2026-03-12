import { getManagedActiveOffer } from "@/lib/affiliate-runtime";
import { AffiliateLink } from "@/components/affiliate-link";
import { affiliateFeaturesEnabled } from "@/lib/feature-flags";

/**
 * Inline affiliate card that sits between branch listings.
 * Contextual: uses the suburb name and a nearby bank name for relevance.
 */
export async function InlineOfferCard({
  suburbName,
  suburbSlug,
  stateSlug,
  nearbyBankName,
}: {
  suburbName: string;
  suburbSlug?: string;
  stateSlug?: string;
  nearbyBankName?: string;
}) {
  if (!affiliateFeaturesEnabled) return null;

  const offer = await getManagedActiveOffer("bank_near_me");

  return (
    <div className="my-6 border border-amber-500/20 bg-amber-500/[0.03] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/60 font-medium mb-1">
            Recommended
          </p>
          <p className="text-[15px] font-light text-white leading-snug">
            {nearbyBankName ? (
              <>
                Paying fees at {nearbyBankName}?{" "}
                <span className="text-amber-400">{offer.brand}</span> offers $0
                monthly fees + {offer.stats[1]?.value} savings rate.
              </>
            ) : (
              <>
                Fed up with branch closures in {suburbName}?{" "}
                <span className="text-amber-400">{offer.brand}</span> is 100%
                digital — $0 fees, works everywhere.
              </>
            )}
          </p>
        </div>
        <AffiliateLink
          href={offer.url}
          offerId={offer.id}
          placement="inline-branch-list"
          suburbSlug={suburbSlug}
          stateSlug={stateSlug}
          className="shrink-0 bg-amber-500 text-black px-5 py-3 text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-amber-400 transition-colors text-center"
        >
          {offer.cta} &rarr;
        </AffiliateLink>
      </div>
      <p className="text-[9px] text-white/20 mt-3">
        We may earn a commission. Not financial advice.
      </p>
    </div>
  );
}
