import { db } from "./db";
import { affiliateClicks, affiliateConversions, weeklyDigests } from "./db/schema";
import { sql, eq, and, gte, lte, desc } from "drizzle-orm";
import { AFFILIATE_OFFERS } from "./affiliate-offers";

/**
 * Estimated revenue per conversion by offer.
 * These are conservative estimates based on research:
 * - ING: $125 referral bonus (we estimate $20-40 affiliate value)
 * - Ubank: $30 referral (we estimate $10-20 affiliate value)
 * - Amex: High-value card ($50-150 affiliate value)
 * Update these as you get real Commission Factory data.
 */
const REVENUE_PER_CONVERSION: Record<string, number> = {
  "ing-125": 35,
  "ubank-30": 15,
  "amex-platinum": 100,
};

/** Estimated conversion rate from click to signup */
const ESTIMATED_CONVERSION_RATE = 0.08; // 8% - conservative for high-intent traffic

export function getEstimatedRevenuePerClick(offerId: string): number {
  const revPerConversion = REVENUE_PER_CONVERSION[offerId] ?? 20;
  return revPerConversion * ESTIMATED_CONVERSION_RATE;
}

export async function getClickStats(startDate: string, endDate: string) {
  const clicks = await db
    .select({
      offerId: affiliateClicks.offerId,
      placement: affiliateClicks.placement,
      count: sql<number>`count(*)`,
    })
    .from(affiliateClicks)
    .where(
      and(
        gte(affiliateClicks.createdAt, startDate),
        lte(affiliateClicks.createdAt, endDate)
      )
    )
    .groupBy(affiliateClicks.offerId, affiliateClicks.placement);

  return clicks;
}

export async function getClicksByPage(startDate: string, endDate: string, limit = 10) {
  return db
    .select({
      pageUrl: affiliateClicks.pageUrl,
      count: sql<number>`count(*)`,
    })
    .from(affiliateClicks)
    .where(
      and(
        gte(affiliateClicks.createdAt, startDate),
        lte(affiliateClicks.createdAt, endDate)
      )
    )
    .groupBy(affiliateClicks.pageUrl)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);
}

export async function getTotalClicks(startDate: string, endDate: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(affiliateClicks)
    .where(
      and(
        gte(affiliateClicks.createdAt, startDate),
        lte(affiliateClicks.createdAt, endDate)
      )
    );
  return result.count;
}

export async function getConfirmedConversions(startDate: string, endDate: string) {
  const [result] = await db
    .select({
      count: sql<number>`count(*)`,
      revenue: sql<number>`COALESCE(sum(revenue_estimate), 0)`,
    })
    .from(affiliateConversions)
    .where(
      and(
        gte(affiliateConversions.createdAt, startDate),
        lte(affiliateConversions.createdAt, endDate)
      )
    );
  return { count: result.count, revenue: result.revenue };
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalClicks: number;
  estimatedConversions: number;
  estimatedRevenue: number;
  clicksByOffer: { offerId: string; brand: string; clicks: number; estRevenue: number }[];
  clicksByPlacement: { placement: string; clicks: number }[];
  topPages: { pageUrl: string; clicks: number }[];
  confirmedConversions: number;
  confirmedRevenue: number;
}

export async function generateWeeklyReport(weekStart: string, weekEnd: string): Promise<WeeklyReport> {
  const clickStats = await getClickStats(weekStart, weekEnd);
  const topPages = await getClicksByPage(weekStart, weekEnd, 10);
  const totalClicks = await getTotalClicks(weekStart, weekEnd);
  const confirmed = await getConfirmedConversions(weekStart, weekEnd);

  // Aggregate by offer
  const offerMap = new Map<string, number>();
  const placementMap = new Map<string, number>();

  for (const row of clickStats) {
    offerMap.set(row.offerId, (offerMap.get(row.offerId) ?? 0) + row.count);
    placementMap.set(row.placement, (placementMap.get(row.placement) ?? 0) + row.count);
  }

  const clicksByOffer = Array.from(offerMap.entries()).map(([offerId, clicks]) => {
    const offer = AFFILIATE_OFFERS.find((o) => o.id === offerId);
    const estRevenue = clicks * getEstimatedRevenuePerClick(offerId);
    return {
      offerId,
      brand: offer?.brand ?? offerId,
      clicks,
      estRevenue: Math.round(estRevenue * 100) / 100,
    };
  });

  const clicksByPlacement = Array.from(placementMap.entries()).map(([placement, clicks]) => ({
    placement,
    clicks,
  }));

  let estimatedRevenue = 0;
  for (const o of clicksByOffer) {
    estimatedRevenue += o.estRevenue;
  }

  const estimatedConversions = Math.round(totalClicks * ESTIMATED_CONVERSION_RATE);

  return {
    weekStart,
    weekEnd,
    totalClicks,
    estimatedConversions,
    estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
    clicksByOffer,
    clicksByPlacement,
    topPages: topPages.map((p) => ({ pageUrl: p.pageUrl ?? "(unknown)", clicks: p.count })),
    confirmedConversions: confirmed.count,
    confirmedRevenue: confirmed.revenue,
  };
}

export async function saveWeeklyDigest(report: WeeklyReport) {
  const topOffer = report.clicksByOffer.sort((a, b) => b.clicks - a.clicks)[0];
  const topPage = report.topPages[0];

  await db.insert(weeklyDigests).values({
    weekStart: report.weekStart,
    weekEnd: report.weekEnd,
    totalClicks: report.totalClicks,
    totalConversions: report.estimatedConversions,
    estimatedRevenue: report.estimatedRevenue,
    topOffer: topOffer?.offerId ?? null,
    topPage: topPage?.pageUrl ?? null,
    reportJson: JSON.stringify(report),
    createdAt: new Date().toISOString(),
  });
}

export async function getLastDigest() {
  const [digest] = await db
    .select()
    .from(weeklyDigests)
    .orderBy(desc(weeklyDigests.createdAt))
    .limit(1);
  return digest;
}
