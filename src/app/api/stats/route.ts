import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyReport, getLastDigest } from "@/lib/revenue";
import { affiliateFeaturesEnabled } from "@/lib/feature-flags";

/**
 * GET /api/stats?period=7d
 * Quick stats endpoint - check performance anytime.
 * Protected by CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  if (!affiliateFeaturesEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = request.nextUrl.searchParams.get("token");
  const secret = process.env.CRON_SECRET;

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const period = request.nextUrl.searchParams.get("period") || "7d";
    const days = period === "30d" ? 30 : period === "24h" ? 1 : 7;

    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);

    const report = await generateWeeklyReport(start.toISOString(), now.toISOString());
    const lastDigest = await getLastDigest();

    return NextResponse.json({
      period: `${days}d`,
      ...report,
      lastEmailSent: lastDigest?.emailSentAt ?? "never",
    });
  } catch (err) {
    console.error("[stats] Failed:", err);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
