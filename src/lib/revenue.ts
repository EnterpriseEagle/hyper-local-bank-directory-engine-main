import { and, desc, gte, lte, sql } from "drizzle-orm";
import { AFFILIATE_OFFERS } from "./affiliate-offers";
import {
  PORTFOLIO_BRAND_NAME,
  PORTFOLIO_DOMAIN_SEEDS,
  coerceSiteKey,
  getOfferSeed,
  getPortfolioDomainSeed,
  getVerticalForSite,
  type ControlPlaneSiteKey,
  type ControlPlaneVertical,
} from "./control-plane";
import { db } from "./db";
import {
  affiliateClickEvents,
  affiliateClicks,
  affiliateConversionEvents,
  affiliateConversions,
  policyEvents,
  weeklyDigests,
  weeklyRollups,
} from "./db/schema";

/**
 * Estimated revenue per conversion by offer.
 * Replace these with real EPC/payout data as affiliate networks come online.
 */
const REVENUE_PER_CONVERSION: Record<string, number> = {
  "ing-125": 35,
  "ubank-30": 15,
  "amex-platinum": 100,
};

/** Estimated conversion rate from click to signup */
const ESTIMATED_CONVERSION_RATE = 0.08;

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function getOfferLabel(offerKey: string): string {
  return (
    getOfferSeed(offerKey)?.advertiser ??
    AFFILIATE_OFFERS.find((offer) => offer.id === offerKey)?.brand ??
    offerKey
  );
}

function buildSiteNotes(input: {
  displayName: string;
  primaryDomain: string | null;
  status: string;
  totalClicks: number;
  vertical: ControlPlaneVertical;
}): string[] {
  const notes: string[] = [];

  if (!input.primaryDomain) {
    notes.push("Primary domain is not mapped in the control plane yet.");
  }

  if (input.status !== "live") {
    notes.push(`Site status is ${input.status}; treat rollups as setup-stage until it is live.`);
  }

  if (input.totalClicks === 0) {
    notes.push("No click data captured this week.");
  }

  if (input.vertical === "health") {
    notes.push("Health vertical should keep its own compliance and offer policy lane.");
  }

  return notes;
}

function createEmptySiteSummary(
  siteKey: ControlPlaneSiteKey
): PortfolioSiteWeeklySummary {
  const domain = getPortfolioDomainSeed(siteKey);

  return {
    siteKey,
    displayName: domain?.displayName ?? siteKey,
    primaryDomain: domain?.primaryDomain ?? null,
    vertical: domain?.vertical ?? getVerticalForSite(siteKey),
    status: domain?.status ?? "draft",
    totalClicks: 0,
    estimatedRevenue: 0,
    confirmedConversions: 0,
    confirmedRevenue: 0,
    topOfferKey: null,
    topOfferLabel: null,
    topPageUrl: null,
    notes: [],
  };
}

function accumulateClickMetrics(
  params: {
    siteKeyRaw: string | null | undefined;
    offerKey: string;
    pageUrl: string | null | undefined;
  },
  state: {
    sites: Map<ControlPlaneSiteKey, PortfolioSiteWeeklySummary>;
    offerClicks: Map<string, number>;
    pageClicks: Map<string, { siteKey: ControlPlaneSiteKey; pageUrl: string; clicks: number }>;
    siteOfferClicks: Map<ControlPlaneSiteKey, Map<string, number>>;
    sitePageClicks: Map<ControlPlaneSiteKey, Map<string, number>>;
  }
) {
  const siteKey = coerceSiteKey(params.siteKeyRaw) ?? "bank_near_me";
  const summary = state.sites.get(siteKey) ?? createEmptySiteSummary(siteKey);
  const pageUrl = params.pageUrl ?? "(unknown)";
  const estimatedRevenue = getEstimatedRevenuePerClick(params.offerKey);

  summary.totalClicks += 1;
  summary.estimatedRevenue = roundCurrency(summary.estimatedRevenue + estimatedRevenue);
  state.sites.set(siteKey, summary);

  state.offerClicks.set(
    params.offerKey,
    (state.offerClicks.get(params.offerKey) ?? 0) + 1
  );

  const pageKey = `${siteKey}:${pageUrl}`;
  state.pageClicks.set(pageKey, {
    siteKey,
    pageUrl,
    clicks: (state.pageClicks.get(pageKey)?.clicks ?? 0) + 1,
  });

  const siteOfferMap = state.siteOfferClicks.get(siteKey) ?? new Map<string, number>();
  siteOfferMap.set(params.offerKey, (siteOfferMap.get(params.offerKey) ?? 0) + 1);
  state.siteOfferClicks.set(siteKey, siteOfferMap);

  const sitePageMap = state.sitePageClicks.get(siteKey) ?? new Map<string, number>();
  sitePageMap.set(pageUrl, (sitePageMap.get(pageUrl) ?? 0) + 1);
  state.sitePageClicks.set(siteKey, sitePageMap);
}

function accumulateConversionMetrics(
  params: {
    siteKeyRaw: string | null | undefined;
    status: string;
    payoutAmount: number | null | undefined;
  },
  sites: Map<ControlPlaneSiteKey, PortfolioSiteWeeklySummary>
) {
  if (params.status !== "confirmed") {
    return;
  }

  const siteKey = coerceSiteKey(params.siteKeyRaw) ?? "bank_near_me";
  const summary = sites.get(siteKey) ?? createEmptySiteSummary(siteKey);
  summary.confirmedConversions += 1;
  summary.confirmedRevenue = roundCurrency(
    summary.confirmedRevenue + (params.payoutAmount ?? 0)
  );
  sites.set(siteKey, summary);
}

export function getEstimatedRevenuePerClick(offerId: string): number {
  const revenuePerConversion = REVENUE_PER_CONVERSION[offerId] ?? 20;
  return revenuePerConversion * ESTIMATED_CONVERSION_RATE;
}

export async function getClickStats(startDate: string, endDate: string) {
  return db
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

export async function generateWeeklyReport(
  weekStart: string,
  weekEnd: string
): Promise<WeeklyReport> {
  const clickStats = await getClickStats(weekStart, weekEnd);
  const topPages = await getClicksByPage(weekStart, weekEnd, 10);
  const totalClicks = await getTotalClicks(weekStart, weekEnd);
  const confirmed = await getConfirmedConversions(weekStart, weekEnd);

  const offerMap = new Map<string, number>();
  const placementMap = new Map<string, number>();

  for (const row of clickStats) {
    offerMap.set(row.offerId, (offerMap.get(row.offerId) ?? 0) + row.count);
    placementMap.set(row.placement, (placementMap.get(row.placement) ?? 0) + row.count);
  }

  const clicksByOffer = Array.from(offerMap.entries()).map(([offerId, clicks]) => {
    const offer = AFFILIATE_OFFERS.find((item) => item.id === offerId);
    const estRevenue = clicks * getEstimatedRevenuePerClick(offerId);

    return {
      offerId,
      brand: offer?.brand ?? offerId,
      clicks,
      estRevenue: roundCurrency(estRevenue),
    };
  });

  const clicksByPlacement = Array.from(placementMap.entries()).map(([placement, clicks]) => ({
    placement,
    clicks,
  }));

  const estimatedRevenue = clicksByOffer.reduce(
    (sum, offer) => sum + offer.estRevenue,
    0
  );
  const estimatedConversions = Math.round(totalClicks * ESTIMATED_CONVERSION_RATE);

  return {
    weekStart,
    weekEnd,
    totalClicks,
    estimatedConversions,
    estimatedRevenue: roundCurrency(estimatedRevenue),
    clicksByOffer,
    clicksByPlacement,
    topPages: topPages.map((page) => ({
      pageUrl: page.pageUrl ?? "(unknown)",
      clicks: page.count,
    })),
    confirmedConversions: confirmed.count,
    confirmedRevenue: confirmed.revenue,
  };
}

export async function saveWeeklyDigest(report: WeeklyReport) {
  const topOffer = [...report.clicksByOffer].sort((a, b) => b.clicks - a.clicks)[0];
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

export interface PortfolioSiteWeeklySummary {
  siteKey: ControlPlaneSiteKey;
  displayName: string;
  primaryDomain: string | null;
  vertical: ControlPlaneVertical;
  status: string;
  totalClicks: number;
  estimatedRevenue: number;
  confirmedConversions: number;
  confirmedRevenue: number;
  topOfferKey: string | null;
  topOfferLabel: string | null;
  topPageUrl: string | null;
  notes: string[];
}

export interface PortfolioPolicyAlert {
  siteKey: ControlPlaneSiteKey;
  displayName: string;
  severity: string;
  eventType: string;
  message: string;
}

export interface PortfolioWeeklyReport {
  portfolioName: string;
  weekStart: string;
  weekEnd: string;
  totalSites: number;
  connectedDomains: number;
  totalClicks: number;
  estimatedRevenue: number;
  confirmedConversions: number;
  confirmedRevenue: number;
  sites: PortfolioSiteWeeklySummary[];
  topOffers: { offerKey: string; label: string; clicks: number; estimatedRevenue: number }[];
  topPages: { siteKey: ControlPlaneSiteKey; displayName: string; pageUrl: string; clicks: number }[];
  policyAlerts: PortfolioPolicyAlert[];
  infrastructureNotes: string[];
}

async function generatePortfolioWeeklyReportFromLegacy(
  weekStart: string,
  weekEnd: string
): Promise<PortfolioWeeklyReport> {
  const legacyReport = await generateWeeklyReport(weekStart, weekEnd);
  const sites = PORTFOLIO_DOMAIN_SEEDS.map((seed) => createEmptySiteSummary(seed.siteKey));
  const bankSite = sites.find((site) => site.siteKey === "bank_near_me");

  if (bankSite) {
    bankSite.totalClicks = legacyReport.totalClicks;
    bankSite.estimatedRevenue = legacyReport.estimatedRevenue;
    bankSite.confirmedConversions = legacyReport.confirmedConversions;
    bankSite.confirmedRevenue = legacyReport.confirmedRevenue;
    bankSite.topOfferKey = legacyReport.clicksByOffer[0]?.offerId ?? null;
    bankSite.topOfferLabel = legacyReport.clicksByOffer[0]?.brand ?? null;
    bankSite.topPageUrl = legacyReport.topPages[0]?.pageUrl ?? null;
  }

  for (const site of sites) {
    site.notes = buildSiteNotes({
      displayName: site.displayName,
      primaryDomain: site.primaryDomain,
      status: site.status,
      totalClicks: site.totalClicks,
      vertical: site.vertical,
    });
  }

  return {
    portfolioName: PORTFOLIO_BRAND_NAME,
    weekStart,
    weekEnd,
    totalSites: sites.length,
    connectedDomains: sites.filter((site) => site.primaryDomain).length,
    totalClicks: legacyReport.totalClicks,
    estimatedRevenue: legacyReport.estimatedRevenue,
    confirmedConversions: legacyReport.confirmedConversions,
    confirmedRevenue: legacyReport.confirmedRevenue,
    sites: sites.sort((a, b) => b.totalClicks - a.totalClicks),
    topOffers: legacyReport.clicksByOffer
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
      .map((offer) => ({
        offerKey: offer.offerId,
        label: offer.brand,
        clicks: offer.clicks,
        estimatedRevenue: offer.estRevenue,
      })),
    topPages: legacyReport.topPages.slice(0, 5).map((page) => ({
      siteKey: "bank_near_me",
      displayName: "Bank Near Me",
      pageUrl: page.pageUrl,
      clicks: page.clicks,
    })),
    policyAlerts: [],
    infrastructureNotes: sites.flatMap((site) =>
      site.notes.map((note) => `${site.displayName}: ${note}`)
    ),
  };
}

export async function generatePortfolioWeeklyReport(
  weekStart: string,
  weekEnd: string
): Promise<PortfolioWeeklyReport> {
  try {
    const [
      controlPlaneClickRows,
      controlPlaneConversionRows,
      legacyClickRows,
      legacyConversionRows,
      policyRows,
    ] = await Promise.all([
      db
        .select({
          legacyClickId: affiliateClickEvents.legacyClickId,
          siteKey: affiliateClickEvents.siteKey,
          offerKey: affiliateClickEvents.offerKey,
          pageUrl: affiliateClickEvents.pageUrl,
        })
        .from(affiliateClickEvents)
        .where(
          and(
            gte(affiliateClickEvents.occurredAt, weekStart),
            lte(affiliateClickEvents.occurredAt, weekEnd)
          )
        ),
      db
        .select({
          legacyConversionId: affiliateConversionEvents.legacyConversionId,
          siteKey: affiliateConversionEvents.siteKey,
          offerKey: affiliateConversionEvents.offerKey,
          status: affiliateConversionEvents.status,
          payoutAmount: affiliateConversionEvents.payoutAmount,
        })
        .from(affiliateConversionEvents)
        .where(
          and(
            gte(affiliateConversionEvents.occurredAt, weekStart),
            lte(affiliateConversionEvents.occurredAt, weekEnd)
          )
        ),
      db
        .select({
          id: affiliateClicks.id,
          offerId: affiliateClicks.offerId,
          pageUrl: affiliateClicks.pageUrl,
        })
        .from(affiliateClicks)
        .where(
          and(
            gte(affiliateClicks.createdAt, weekStart),
            lte(affiliateClicks.createdAt, weekEnd)
          )
        ),
      db
        .select({
          id: affiliateConversions.id,
          offerId: affiliateConversions.offerId,
          status: affiliateConversions.status,
          revenueEstimate: affiliateConversions.revenueEstimate,
        })
        .from(affiliateConversions)
        .where(
          and(
            gte(affiliateConversions.createdAt, weekStart),
            lte(affiliateConversions.createdAt, weekEnd)
          )
        ),
      db
        .select({
          siteKey: policyEvents.siteKey,
          severity: policyEvents.severity,
          eventType: policyEvents.eventType,
          message: policyEvents.message,
        })
        .from(policyEvents)
        .where(
          and(gte(policyEvents.createdAt, weekStart), lte(policyEvents.createdAt, weekEnd))
        ),
    ]);

    if (
      controlPlaneClickRows.length === 0 &&
      controlPlaneConversionRows.length === 0 &&
      legacyClickRows.length === 0 &&
      legacyConversionRows.length === 0
    ) {
      return generatePortfolioWeeklyReportFromLegacy(weekStart, weekEnd);
    }

    const sites = new Map<ControlPlaneSiteKey, PortfolioSiteWeeklySummary>();
    const offerClicks = new Map<string, number>();
    const pageClicks = new Map<string, { siteKey: ControlPlaneSiteKey; pageUrl: string; clicks: number }>();
    const siteOfferClicks = new Map<ControlPlaneSiteKey, Map<string, number>>();
    const sitePageClicks = new Map<ControlPlaneSiteKey, Map<string, number>>();

    for (const seed of PORTFOLIO_DOMAIN_SEEDS) {
      sites.set(seed.siteKey, createEmptySiteSummary(seed.siteKey));
    }

    for (const row of controlPlaneClickRows) {
      accumulateClickMetrics(
        {
          siteKeyRaw: row.siteKey,
          offerKey: row.offerKey,
          pageUrl: row.pageUrl,
        },
        { sites, offerClicks, pageClicks, siteOfferClicks, sitePageClicks }
      );
    }

    const mirroredLegacyClickIds = new Set(
      controlPlaneClickRows
        .map((row) => row.legacyClickId)
        .filter((value): value is number => typeof value === "number")
    );

    for (const row of legacyClickRows) {
      if (mirroredLegacyClickIds.has(row.id)) {
        continue;
      }

      accumulateClickMetrics(
        {
          siteKeyRaw: "bank_near_me",
          offerKey: row.offerId,
          pageUrl: row.pageUrl,
        },
        { sites, offerClicks, pageClicks, siteOfferClicks, sitePageClicks }
      );
    }

    for (const row of controlPlaneConversionRows) {
      accumulateConversionMetrics(
        {
          siteKeyRaw: row.siteKey,
          status: row.status,
          payoutAmount: row.payoutAmount,
        },
        sites
      );
    }

    const mirroredLegacyConversionIds = new Set(
      controlPlaneConversionRows
        .map((row) => row.legacyConversionId)
        .filter((value): value is number => typeof value === "number")
    );

    for (const row of legacyConversionRows) {
      if (mirroredLegacyConversionIds.has(row.id)) {
        continue;
      }

      accumulateConversionMetrics(
        {
          siteKeyRaw: "bank_near_me",
          status: row.status,
          payoutAmount: row.revenueEstimate,
        },
        sites
      );
    }

    const siteSummaries = Array.from(sites.values()).map((summary) => {
      const offersForSite = Array.from(siteOfferClicks.get(summary.siteKey)?.entries() ?? []);
      const pagesForSite = Array.from(sitePageClicks.get(summary.siteKey)?.entries() ?? []);
      const topOffer = offersForSite.sort((a, b) => b[1] - a[1])[0];
      const topPage = pagesForSite.sort((a, b) => b[1] - a[1])[0];

      summary.topOfferKey = topOffer?.[0] ?? null;
      summary.topOfferLabel = topOffer ? getOfferLabel(topOffer[0]) : null;
      summary.topPageUrl = topPage?.[0] ?? null;
      summary.notes = buildSiteNotes({
        displayName: summary.displayName,
        primaryDomain: summary.primaryDomain,
        status: summary.status,
        totalClicks: summary.totalClicks,
        vertical: summary.vertical,
      });

      return summary;
    });

    const topOffers = Array.from(offerClicks.entries())
      .map(([offerKey, clicks]) => ({
        offerKey,
        label: getOfferLabel(offerKey),
        clicks,
        estimatedRevenue: roundCurrency(clicks * getEstimatedRevenuePerClick(offerKey)),
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    const topPages = Array.from(pageClicks.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5)
      .map((page) => ({
        siteKey: page.siteKey,
        displayName: sites.get(page.siteKey)?.displayName ?? page.siteKey,
        pageUrl: page.pageUrl,
        clicks: page.clicks,
      }));

    const alerts = policyRows.map((row) => {
      const siteKey = coerceSiteKey(row.siteKey) ?? "bank_near_me";
      return {
        siteKey,
        displayName: sites.get(siteKey)?.displayName ?? siteKey,
        severity: row.severity,
        eventType: row.eventType,
        message: row.message,
      };
    });

    return {
      portfolioName: PORTFOLIO_BRAND_NAME,
      weekStart,
      weekEnd,
      totalSites: siteSummaries.length,
      connectedDomains: siteSummaries.filter((site) => site.primaryDomain).length,
      totalClicks: siteSummaries.reduce((sum, site) => sum + site.totalClicks, 0),
      estimatedRevenue: roundCurrency(
        siteSummaries.reduce((sum, site) => sum + site.estimatedRevenue, 0)
      ),
      confirmedConversions: siteSummaries.reduce(
        (sum, site) => sum + site.confirmedConversions,
        0
      ),
      confirmedRevenue: roundCurrency(
        siteSummaries.reduce((sum, site) => sum + site.confirmedRevenue, 0)
      ),
      sites: siteSummaries.sort((a, b) => b.totalClicks - a.totalClicks),
      topOffers,
      topPages,
      policyAlerts: alerts,
      infrastructureNotes: siteSummaries.flatMap((site) =>
        site.notes.map((note) => `${site.displayName}: ${note}`)
      ),
    };
  } catch (error) {
    console.warn("[revenue] Falling back to legacy weekly report:", error);
    return generatePortfolioWeeklyReportFromLegacy(weekStart, weekEnd);
  }
}

export async function savePortfolioWeeklyRollups(
  report: PortfolioWeeklyReport,
  options?: { emailSentAt?: string | null }
) {
  const createdAt = new Date().toISOString();

  try {
    if (report.sites.length === 0) {
      return;
    }

    for (const site of report.sites) {
      const row = {
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        siteKey: site.siteKey,
        vertical: site.vertical,
        totalClicks: site.totalClicks,
        totalConversions: site.confirmedConversions,
        estimatedRevenue: site.estimatedRevenue,
        confirmedRevenue: site.confirmedRevenue,
        topOfferKey: site.topOfferKey,
        topPageUrl: site.topPageUrl,
        reportJson: JSON.stringify(site),
        emailSentAt: options?.emailSentAt ?? null,
        createdAt,
      };

      await db
        .insert(weeklyRollups)
        .values(row)
        .onConflictDoUpdate({
          target: [weeklyRollups.weekStart, weeklyRollups.siteKey],
          set: {
            weekEnd: row.weekEnd,
            vertical: row.vertical,
            totalClicks: row.totalClicks,
            totalConversions: row.totalConversions,
            estimatedRevenue: row.estimatedRevenue,
            confirmedRevenue: row.confirmedRevenue,
            topOfferKey: row.topOfferKey,
            topPageUrl: row.topPageUrl,
            reportJson: row.reportJson,
            emailSentAt: row.emailSentAt,
          },
        });
    }
  } catch (error) {
    console.warn("[revenue] Failed to save portfolio rollups:", error);
  }
}
