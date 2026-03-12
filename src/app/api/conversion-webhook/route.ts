import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { affiliateConversions } from "@/lib/db/schema";
import { affiliateFeaturesEnabled } from "@/lib/feature-flags";

/**
 * POST /api/conversion-webhook
 * Receives conversion postbacks from affiliate networks (Commission Factory, Awin, etc.)
 *
 * Commission Factory postback URL format:
 * https://banknearme.com.au/api/conversion-webhook?token=SECRET
 *
 * Body: { clickId, offerId, revenue, source, externalRef }
 */
export async function POST(request: NextRequest) {
  if (!affiliateFeaturesEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = request.nextUrl.searchParams.get("token");
  const secret = process.env.CRON_SECRET;

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clickId, offerId, revenue, source, externalRef } = body;

    if (!offerId) {
      return NextResponse.json({ error: "Missing offerId" }, { status: 400 });
    }

    await db.insert(affiliateConversions).values({
      clickId: clickId ? Number(clickId) : null,
      offerId,
      status: "confirmed",
      revenueEstimate: revenue ? Number(revenue) : null,
      source: source || "commission_factory",
      externalRef: externalRef || null,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[conversion-webhook] Failed:", err);
    return NextResponse.json({ error: "Failed to record conversion" }, { status: 500 });
  }
}
