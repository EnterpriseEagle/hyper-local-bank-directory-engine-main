import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  affiliateClickEvents,
  affiliateConversionEvents,
  affiliateConversions,
} from "@/lib/db/schema";
import { affiliateFeaturesEnabled } from "@/lib/feature-flags";
import { buildTrackingContext } from "@/lib/control-plane";

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
  const secret =
    process.env.AFFILIATE_WEBHOOK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim();

  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      clickId,
      offerId,
      revenue,
      source,
      externalRef,
      pageUrl,
      suburbSlug,
      stateSlug,
      siteKey,
      pageType,
      intentKey,
      entitySlug,
      domain,
      decisionKey,
      payoutCurrency,
      metadata,
    } = body;

    if (!offerId) {
      return NextResponse.json({ error: "Missing offerId" }, { status: 400 });
    }

    const occurredAt = new Date().toISOString();
    const host = request.headers.get("host");
    const numericClickId = clickId ? Number(clickId) : null;

    if (typeof externalRef === "string" && externalRef.length > 0) {
      const [existingConversion] = await db
        .select({ id: affiliateConversions.id })
        .from(affiliateConversions)
        .where(
          and(
            eq(affiliateConversions.offerId, offerId),
            eq(affiliateConversions.externalRef, externalRef)
          )
        )
        .limit(1);

      if (existingConversion) {
        return NextResponse.json({ success: true, duplicate: true });
      }
    }

    const [legacyConversion] = await db
      .insert(affiliateConversions)
      .values({
        clickId: numericClickId,
        offerId,
        status: "confirmed",
        revenueEstimate: revenue ? Number(revenue) : null,
        source: source || "commission_factory",
        externalRef: externalRef || null,
        createdAt: occurredAt,
        confirmedAt: occurredAt,
      })
      .returning({ id: affiliateConversions.id });

    try {
      const [matchingClickEvent] = numericClickId
        ? await db
            .select()
            .from(affiliateClickEvents)
            .where(eq(affiliateClickEvents.legacyClickId, numericClickId))
            .limit(1)
        : [];

      const fallbackContext = buildTrackingContext({
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

      await db.insert(affiliateConversionEvents).values({
        legacyConversionId: legacyConversion?.id ?? null,
        legacyClickId: numericClickId,
        clickEventId: matchingClickEvent?.id ?? null,
        siteKey: matchingClickEvent?.siteKey ?? fallbackContext.siteKey,
        domain: matchingClickEvent?.domain ?? fallbackContext.domain,
        vertical: matchingClickEvent?.vertical ?? fallbackContext.vertical,
        intentKey: matchingClickEvent?.intentKey ?? fallbackContext.intentKey,
        pageType: matchingClickEvent?.pageType ?? fallbackContext.pageType,
        entitySlug: matchingClickEvent?.entitySlug ?? fallbackContext.entitySlug,
        offerKey: offerId,
        decisionKey:
          (typeof decisionKey === "string" && decisionKey.length > 0
            ? decisionKey
            : matchingClickEvent?.decisionKey) ?? null,
        status: "confirmed",
        source: source || "commission_factory",
        externalRef: externalRef || null,
        payoutAmount: revenue ? Number(revenue) : null,
        payoutCurrency:
          typeof payoutCurrency === "string" && payoutCurrency.length > 0
            ? payoutCurrency
            : "AUD",
        metadataJson: metadata ? JSON.stringify(metadata) : null,
        occurredAt,
        confirmedAt: occurredAt,
      });
    } catch (controlPlaneError) {
      console.warn("[conversion-webhook] Control-plane write skipped:", controlPlaneError);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[conversion-webhook] Failed:", err);
    return NextResponse.json({ error: "Failed to record conversion" }, { status: 500 });
  }
}
