import { NextRequest, NextResponse } from "next/server";
import { affiliateFeaturesEnabled, affiliateOpsAutoContactEnabled, affiliateOpsAutoPauseEnabled } from "@/lib/feature-flags";
import { recordPayoutReceipt, runPayoutAgent } from "@/lib/payout-agent";

function isAuthorized(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const headerToken = request.headers.get("authorization")?.replace("Bearer ", "");
  const secret =
    process.env.AFFILIATE_OPS_SECRET?.trim() ||
    process.env.REPORT_CRON_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();

  return Boolean(secret && (token === secret || headerToken === secret));
}

export async function POST(request: NextRequest) {
  if (!affiliateFeaturesEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const amount = Number(body.amount);

    if (!body.offerKey || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "offerKey and positive amount are required" },
        { status: 400 }
      );
    }

    await recordPayoutReceipt({
      offerKey: body.offerKey,
      amount,
      currency: typeof body.currency === "string" ? body.currency : "AUD",
      source: typeof body.source === "string" ? body.source : null,
      siteKey: typeof body.siteKey === "string" ? body.siteKey : null,
      periodStart: typeof body.periodStart === "string" ? body.periodStart : null,
      periodEnd: typeof body.periodEnd === "string" ? body.periodEnd : null,
      externalRef: typeof body.externalRef === "string" ? body.externalRef : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      receivedAt: typeof body.receivedAt === "string" ? body.receivedAt : null,
    });

    const rerunAgent = body.rerunAgent !== false;
    const agentSummary = rerunAgent
      ? await runPayoutAgent({
          autoContact: affiliateOpsAutoContactEnabled,
          autoPause: affiliateOpsAutoPauseEnabled,
        })
      : null;

    return NextResponse.json({
      success: true,
      rerunAgent,
      remainingIssues: agentSummary?.cases.length ?? null,
      totalOutstandingAmount: agentSummary?.totalOutstandingAmount ?? null,
    });
  } catch (error) {
    console.error("[payout-receipts] Failed:", error);
    return NextResponse.json({ error: "Failed to record payout receipt" }, { status: 500 });
  }
}
