import { NextRequest, NextResponse } from "next/server";
import { affiliateFeaturesEnabled, affiliateOpsAutoContactEnabled, affiliateOpsAutoPauseEnabled } from "@/lib/feature-flags";
import { runPayoutAgent } from "@/lib/payout-agent";

function isAuthorized(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const headerToken = request.headers.get("authorization")?.replace("Bearer ", "");
  const secret =
    process.env.AFFILIATE_OPS_SECRET?.trim() ||
    process.env.REPORT_CRON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();

  return Boolean(secret && (token === secret || headerToken === secret));
}

export async function GET(request: NextRequest) {
  if (!affiliateFeaturesEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";
    const result = await runPayoutAgent({
      autoContact: dryRun ? false : affiliateOpsAutoContactEnabled,
      autoPause: dryRun ? false : affiliateOpsAutoPauseEnabled,
    });

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        runAt: result.runAt,
        issues: result.cases.length,
        totalOutstandingAmount: result.totalOutstandingAmount,
        pausedOffers: result.pausedOffers,
        contactedPartners: result.contactedPartners,
      },
      cases: result.cases,
    });
  } catch (error) {
    console.error("[payout-agent] Failed:", error);
    return NextResponse.json({ error: "Failed to run payout agent" }, { status: 500 });
  }
}
