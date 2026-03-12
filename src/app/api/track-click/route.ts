import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  affiliateClickEvents,
  affiliateClicks,
  affiliateDecisions,
} from "@/lib/db/schema";
import { isRateLimited, getIpHash } from "@/lib/rate-limit";
import { affiliateFeaturesEnabled } from "@/lib/feature-flags";
import { buildTrackingContext, createDecisionKey } from "@/lib/control-plane";

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
    const {
      offerId,
      placement,
      pageUrl,
      suburbSlug,
      stateSlug,
      siteKey,
      pageType,
      intentKey,
      entitySlug,
      domain,
      decisionKey,
    } = body;

    if (!offerId || !placement) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userAgent = request.headers.get("user-agent") || undefined;
    const referrer = request.headers.get("referer") || undefined;
    const host = request.headers.get("host");
    const createdAt = new Date().toISOString();
    const context = buildTrackingContext({
      pageUrl,
      host,
      siteKey,
      domain,
      pageType,
      intentKey,
      entitySlug,
      suburbSlug,
      stateSlug,
    });
    const resolvedDecisionKey =
      typeof decisionKey === "string" && decisionKey.length > 0
        ? decisionKey
        : createDecisionKey("decision");

    const [legacyClick] = await db
      .insert(affiliateClicks)
      .values({
        offerId,
        placement,
        pageUrl: pageUrl || null,
        suburbSlug: suburbSlug || null,
        stateSlug: stateSlug || null,
        referrer: referrer || null,
        userAgent: userAgent || null,
        ipHash,
        createdAt,
      })
      .returning({ id: affiliateClicks.id });

    try {
      await db
        .insert(affiliateDecisions)
        .values({
          decisionKey: resolvedDecisionKey,
          siteKey: context.siteKey,
          domain: context.domain,
          vertical: context.vertical,
          intentKey: context.intentKey,
          pageType: context.pageType,
          entitySlug: context.entitySlug,
          placementKey: placement,
          offerKey: offerId,
          fallbackReason: "legacy_active_offer",
          source: "legacy_click_track",
          contextJson: JSON.stringify({
            pageUrl: pageUrl || null,
            suburbSlug: context.suburbSlug,
            stateSlug: context.stateSlug,
            referrer: referrer || null,
          }),
          decidedAt: createdAt,
        })
        .onConflictDoNothing();

      await db.insert(affiliateClickEvents).values({
        legacyClickId: legacyClick?.id ?? null,
        siteKey: context.siteKey,
        domain: context.domain,
        vertical: context.vertical,
        intentKey: context.intentKey,
        pageType: context.pageType,
        entitySlug: context.entitySlug,
        suburbSlug: context.suburbSlug,
        stateSlug: context.stateSlug,
        placementKey: placement,
        offerKey: offerId,
        decisionKey: resolvedDecisionKey,
        pageUrl: pageUrl || null,
        referrer: referrer || null,
        userAgent: userAgent || null,
        ipHash,
        occurredAt: createdAt,
      });
    } catch (controlPlaneError) {
      console.warn("[track-click] Control-plane write skipped:", controlPlaneError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[track-click] Failed:", err);
    return NextResponse.json({ error: "Failed to track click" }, { status: 500 });
  }
}
