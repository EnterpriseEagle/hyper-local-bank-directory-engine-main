import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { affiliateClicks } from "@/lib/db/schema";
import { isRateLimited, getIpHash } from "@/lib/rate-limit";
import { affiliateFeaturesEnabled } from "@/lib/feature-flags";

export async function POST(request: NextRequest) {
  if (!affiliateFeaturesEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const ipHash = getIpHash(request);

    // Rate limit: max 20 clicks per minute per IP
    if (isRateLimited(`click:${ipHash}`, 20, 60_000)) {
      return NextResponse.json({ success: true }); // silent success to not break UX
    }

    const body = await request.json();
    const { offerId, placement, pageUrl, suburbSlug, stateSlug } = body;

    if (!offerId || !placement) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || undefined;
    const referrer = request.headers.get("referer") || undefined;

    await db.insert(affiliateClicks).values({
      offerId,
      placement,
      pageUrl: pageUrl || null,
      suburbSlug: suburbSlug || null,
      stateSlug: stateSlug || null,
      referrer: referrer || null,
      userAgent: userAgent || null,
      ipHash,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[track-click] Failed:", err);
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 });
  }
}
