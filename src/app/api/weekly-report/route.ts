import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyReport, saveWeeklyDigest } from "@/lib/revenue";
import { sendWeeklyEmail } from "@/lib/email";
import { affiliateFeaturesEnabled } from "@/lib/feature-flags";

/**
 * GET /api/weekly-report
 * Generates the weekly affiliate performance report and emails it.
 *
 * Protected by a simple secret token in the query string or header.
 * Set CRON_SECRET in your environment variables.
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
  const secret = process.env.CRON_SECRET;

  if (!secret || (token !== secret && headerToken !== secret && vercelCron !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Calculate last 7 days
    const now = new Date();
    const weekEnd = now.toISOString().split("T")[0];
    const weekStartDate = new Date(now);
    weekStartDate.setDate(weekStartDate.getDate() - 7);
    const weekStart = weekStartDate.toISOString().split("T")[0];

    // Generate report
    const report = await generateWeeklyReport(
      weekStartDate.toISOString(),
      now.toISOString()
    );

    // Save to DB
    await saveWeeklyDigest(report);

    // Send email
    const emailSent = await sendWeeklyEmail(report);

    return NextResponse.json({
      success: true,
      emailSent,
      summary: {
        period: `${weekStart} to ${weekEnd}`,
        totalClicks: report.totalClicks,
        estimatedConversions: report.estimatedConversions,
        estimatedRevenue: `$${report.estimatedRevenue.toFixed(2)}`,
        confirmedRevenue: `$${report.confirmedRevenue.toFixed(2)}`,
        topOffer: report.clicksByOffer[0]?.brand ?? "none",
      },
    });
  } catch (err) {
    console.error("[weekly-report] Failed:", err);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
