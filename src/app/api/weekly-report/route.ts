import { NextRequest, NextResponse } from "next/server";
import {
  generatePortfolioWeeklyReport,
  generateWeeklyReport,
  savePortfolioWeeklyRollups,
  saveWeeklyDigest,
} from "@/lib/revenue";
import { runPayoutAgent } from "@/lib/payout-agent";
import { sendPortfolioWeeklyEmail } from "@/lib/email";
import {
  affiliateFeaturesEnabled,
  affiliateOpsAutoContactEnabled,
  affiliateOpsAutoPauseEnabled,
} from "@/lib/feature-flags";

/**
 * GET /api/weekly-report
 * Generates the weekly affiliate performance report and emails it.
 *
 * Protected by a simple secret token in the query string or header.
 * Set REPORT_CRON_SECRET (or fall back to CRON_SECRET) in env.
 *
 * Trigger options:
 * 1. Vercel Cron: add to vercel.json
 * 2. External cron service: hit this URL weekly
 * 3. Manual: visit /api/weekly-report?token=YOUR_SECRET
 */
export async function GET(request: NextRequest) {
  if (!affiliateFeaturesEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Auth check — supports query param, Authorization header, and Vercel cron header
  const token = request.nextUrl.searchParams.get("token");
  const headerToken = request.headers.get("authorization")?.replace("Bearer ", "");
  const vercelCron = request.headers.get("x-vercel-cron-secret");
  const secret =
    process.env.REPORT_CRON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();

  if (!secret || (token !== secret && headerToken !== secret && vercelCron !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const weekEnd = now.toISOString().split("T")[0];
    const weekStartDate = new Date(now);
    weekStartDate.setDate(weekStartDate.getDate() - 7);
    const weekStart = weekStartDate.toISOString().split("T")[0];
    const periodStartIso = weekStartDate.toISOString();
    const periodEndIso = now.toISOString();

    const legacyReport = await generateWeeklyReport(periodStartIso, periodEndIso);
    const portfolioReport = await generatePortfolioWeeklyReport(periodStartIso, periodEndIso);

    await saveWeeklyDigest(legacyReport);

    const emailSent = await sendPortfolioWeeklyEmail(portfolioReport);
    await savePortfolioWeeklyRollups(portfolioReport, {
      emailSentAt: emailSent ? new Date().toISOString() : null,
    });
    const payoutOps = await runPayoutAgent({
      autoContact: affiliateOpsAutoContactEnabled,
      autoPause: affiliateOpsAutoPauseEnabled,
    });

    return NextResponse.json({
      success: true,
      emailSent,
      summary: {
        period: `${weekStart} to ${weekEnd}`,
        totalClicks: portfolioReport.totalClicks,
        totalSites: portfolioReport.totalSites,
        connectedDomains: portfolioReport.connectedDomains,
        estimatedRevenue: `$${portfolioReport.estimatedRevenue.toFixed(2)}`,
        confirmedRevenue: `$${portfolioReport.confirmedRevenue.toFixed(2)}`,
        topSite: portfolioReport.sites[0]?.displayName ?? "none",
        topOffer: portfolioReport.topOffers[0]?.label ?? legacyReport.clicksByOffer[0]?.brand ?? "none",
        payoutIssues: payoutOps.cases.length,
        payoutOutstandingAmount: `$${payoutOps.totalOutstandingAmount.toFixed(2)}`,
      },
    });
  } catch (err) {
    console.error("[weekly-report] Failed:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
