import { and, asc, eq, isNull } from "drizzle-orm";
import {
  type AffiliateOffer,
  getActiveOffer,
  getAffiliateOfferById,
  getFallbackOffer,
} from "./affiliate-offers";
import { db } from "./db";
import { offerCatalog, offerRules, payoutCases } from "./db/schema";

export async function getManagedActiveOffer(siteKey = "bank_near_me"): Promise<AffiliateOffer> {
  try {
    let sawManagedRows = false;
    let blockedOfferKey: string | null = null;
    const rows = await db
      .select({
        offerKey: offerCatalog.offerKey,
        destinationUrl: offerCatalog.destinationUrl,
        offerStatus: offerCatalog.status,
        ruleStatus: offerRules.status,
      })
      .from(offerRules)
      .innerJoin(offerCatalog, eq(offerRules.offerId, offerCatalog.id))
      .where(eq(offerRules.siteKey, siteKey))
      .orderBy(asc(offerRules.priority));

    for (const row of rows) {
      sawManagedRows = true;
      if (row.offerStatus !== "active" || row.ruleStatus !== "active") {
        blockedOfferKey = blockedOfferKey ?? row.offerKey;
        continue;
      }

      const offer = getAffiliateOfferById(row.offerKey);
      if (!offer) {
        continue;
      }

      return {
        ...offer,
        active: true,
        url: row.destinationUrl || offer.url,
      };
    }

    if (sawManagedRows) {
      return getFallbackOffer(blockedOfferKey);
    }

    const activeOffer = getActiveOffer();
    const [blockedCase] = await db
      .select({ offerKey: payoutCases.offerKey })
      .from(payoutCases)
      .where(
        and(
          eq(payoutCases.offerKey, activeOffer.id),
          eq(payoutCases.status, "paused"),
          isNull(payoutCases.resolvedAt)
        )
      )
      .limit(1);

    if (blockedCase?.offerKey) {
      return getFallbackOffer(blockedCase.offerKey);
    }
  } catch (error) {
    console.warn("[affiliate-runtime] Falling back to static offer:", error);
  }

  return getActiveOffer();
}
