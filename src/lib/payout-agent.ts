import { and, eq, lte, sql } from "drizzle-orm";
import {
  AFFILIATE_OFFERS,
  getAffiliateOfferById,
  getFallbackOffer,
} from "./affiliate-offers";
import { db } from "./db";
import {
  affiliateConversionEvents,
  offerCatalog,
  payoutCases,
  payoutReceipts,
  policyEvents,
} from "./db/schema";
import {
  affiliateOpsAutoContactEnabled,
  affiliateOpsAutoPauseEnabled,
} from "./feature-flags";
import { sendPartnerPayoutEmail, sendPayoutOpsSummaryEmail } from "./ops-email";

type PayoutStage = "friendly_reminder" | "overdue_notice" | "final_notice" | "resolved";
type PayoutStatus = "monitoring" | "attention" | "paused" | "resolved";
type PayoutSeverity = "info" | "warn" | "critical";

export interface PayoutAgentCaseSummary {
  offerKey: string;
  advertiser: string;
  network: string;
  partnerEmail: string | null;
  status: PayoutStatus;
  severity: PayoutSeverity;
  stage: PayoutStage;
  dueConversions: number;
  dueRevenue: number;
  receiptsTotal: number;
  outstandingAmount: number;
  oldestOccurredAt: string | null;
  dueAt: string | null;
  recommendedAction: string;
  affectedSites: string[];
  emailSent: boolean;
  pausedOffer: boolean;
}

export interface PayoutAgentRunSummary {
  runAt: string;
  cases: PayoutAgentCaseSummary[];
  totalOutstandingAmount: number;
  pausedOffers: string[];
  contactedPartners: string[];
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toIsoDate(value: Date) {
  return value.toISOString();
}

function diffInDays(later: Date, earlier: Date) {
  return Math.max(
    0,
    Math.floor((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24))
  );
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getPartnerContactEmail(offerKey: string, fallback: string | null) {
  const envKey = `AFFILIATE_CONTACT_EMAIL_${offerKey
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")}`;

  return process.env[envKey]?.trim() || fallback;
}

function getCaseStage(input: {
  daysLate: number;
  gracePeriodDays: number;
  pauseTrafficAfterDays: number;
}): { stage: PayoutStage; severity: PayoutSeverity; status: PayoutStatus; recommendedAction: string } {
  if (input.daysLate <= input.gracePeriodDays) {
    return {
      stage: "friendly_reminder",
      severity: "info",
      status: "monitoring",
      recommendedAction: "Monitor and send a soft reminder.",
    };
  }

  if (input.daysLate < input.pauseTrafficAfterDays) {
    return {
      stage: "overdue_notice",
      severity: "warn",
      status: "attention",
      recommendedAction: "Send overdue notice and prepare traffic reallocation.",
    };
  }

  return {
    stage: "final_notice",
    severity: "critical",
    status: "paused",
    recommendedAction:
      "Pause traffic allocation and switch placements to the fallback partner until payment is resolved.",
  };
}

function buildPartnerEmail(input: {
  advertiser: string;
  stage: PayoutStage;
  outstandingAmount: number;
  currency: string;
  dueConversions: number;
  oldestOccurredAt: string | null;
  dueAt: string | null;
  fallbackAdvertiser: string;
}) {
  const dueDateLabel = input.dueAt
    ? new Date(input.dueAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "the agreed payout date";
  const oldestLabel = input.oldestOccurredAt
    ? new Date(input.oldestOccurredAt).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "the current reconciliation window";

  if (input.stage === "friendly_reminder") {
    return {
      subject: `Payout check-in: ${input.advertiser} conversions now due`,
      bodyText: `Hi team,

We are reconciling payouts for our Near Me Network traffic and can see ${input.dueConversions} confirmed ${input.advertiser} conversion(s) from ${oldestLabel} onward that are now due.

Current outstanding total: ${input.currency} ${input.outstandingAmount.toFixed(2)}
Due date under our current terms: ${dueDateLabel}

Please confirm the payment status or remittance timing for these conversions.

Thanks,
Near Me Network Ops`,
    };
  }

  if (input.stage === "overdue_notice") {
    return {
      subject: `Overdue payout notice: ${input.advertiser} partner balance pending`,
      bodyText: `Hi team,

We are following up on an overdue payout balance for our Near Me Network traffic.

Confirmed conversions due: ${input.dueConversions}
Outstanding amount: ${input.currency} ${input.outstandingAmount.toFixed(2)}
Original due date: ${dueDateLabel}

Please send remittance confirmation or a payment date. If there is a discrepancy on your side, reply with the detail so we can reconcile it quickly.

Regards,
Near Me Network Ops`,
    };
  }

  return {
    subject: `Final payout notice: ${input.advertiser} traffic will be reallocated`,
    bodyText: `Hi team,

We still have an unresolved overdue payout balance tied to our Near Me Network traffic.

Confirmed conversions due: ${input.dueConversions}
Outstanding amount: ${input.currency} ${input.outstandingAmount.toFixed(2)}
Original due date: ${dueDateLabel}

If payment confirmation is not received immediately, we will pause this traffic lane and reallocate placements to ${input.fallbackAdvertiser}.

If you believe this balance is incorrect, reply with the reconciliation detail today.

Near Me Network Ops`,
  };
}

function buildSummaryEmail(run: PayoutAgentRunSummary) {
  const caseRows = run.cases
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${item.advertiser}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-transform:uppercase">${item.severity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${item.dueConversions}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">$${item.outstandingAmount.toFixed(2)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${item.recommendedAction}</td>
        </tr>`
    )
    .join("");

  return {
    subject: `Payout ops: ${run.cases.length} issue${run.cases.length === 1 ? "" : "s"} | $${run.totalOutstandingAmount.toFixed(2)} outstanding`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;background:#f8fafc;color:#111">
        <h1 style="margin:0 0 8px;font-size:24px">Near Me Network payout ops</h1>
        <p style="margin:0 0 18px;color:#475569">Run at ${run.runAt}</p>
        <p style="margin:0 0 18px;color:#0f172a">
          Outstanding balance tracked: <strong>$${run.totalOutstandingAmount.toFixed(2)}</strong>
        </p>
        <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb">
          <thead>
            <tr style="background:#f1f5f9;text-align:left">
              <th style="padding:10px 12px">Partner</th>
              <th style="padding:10px 12px">Severity</th>
              <th style="padding:10px 12px">Due conv.</th>
              <th style="padding:10px 12px">Outstanding</th>
              <th style="padding:10px 12px">Action</th>
            </tr>
          </thead>
          <tbody>${caseRows || '<tr><td colspan="5" style="padding:16px">No payout issues detected.</td></tr>'}</tbody>
        </table>
      </div>
    `,
  };
}

export async function recordPayoutReceipt(input: {
  offerKey: string;
  amount: number;
  currency?: string;
  source?: string | null;
  siteKey?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  externalRef?: string | null;
  notes?: string | null;
  receivedAt?: string | null;
}) {
  const createdAt = new Date().toISOString();
  const receivedAt = input.receivedAt?.trim() || createdAt;

  await db.insert(payoutReceipts).values({
    offerKey: input.offerKey,
    siteKey: input.siteKey ?? null,
    source: input.source ?? null,
    amount: input.amount,
    currency: input.currency ?? "AUD",
    periodStart: input.periodStart ?? null,
    periodEnd: input.periodEnd ?? null,
    externalRef: input.externalRef ?? null,
    notes: input.notes ?? null,
    receivedAt,
    createdAt,
  });
}

export async function runPayoutAgent(options?: {
  now?: Date;
  autoContact?: boolean;
  autoPause?: boolean;
}) {
  const now = options?.now ?? new Date();
  const nowIso = now.toISOString();
  const cases: PayoutAgentCaseSummary[] = [];
  const pausedOffers: string[] = [];
  const contactedPartners: string[] = [];
  const autoContact = options?.autoContact ?? affiliateOpsAutoContactEnabled;
  const autoPause = options?.autoPause ?? affiliateOpsAutoPauseEnabled;

  for (const offer of AFFILIATE_OFFERS) {
    const partnerEmail = getPartnerContactEmail(offer.id, offer.ops.contactEmail);
    const dueCutoff = addDays(now, -offer.ops.paymentTermsDays).toISOString();

    const [dueTotals] = await db
      .select({
        conversions: sql<number>`count(*)`,
        revenue: sql<number>`COALESCE(sum(${affiliateConversionEvents.payoutAmount}), 0)`,
        oldestOccurredAt: sql<string | null>`min(${affiliateConversionEvents.occurredAt})`,
      })
      .from(affiliateConversionEvents)
      .where(
        and(
          eq(affiliateConversionEvents.offerKey, offer.id),
          eq(affiliateConversionEvents.status, "confirmed"),
          lte(affiliateConversionEvents.occurredAt, dueCutoff)
        )
      );

    const [receiptTotals] = await db
      .select({
        total: sql<number>`COALESCE(sum(${payoutReceipts.amount}), 0)`,
      })
      .from(payoutReceipts)
      .where(eq(payoutReceipts.offerKey, offer.id));

    const affectedSites = await db
      .select({
        siteKey: affiliateConversionEvents.siteKey,
      })
      .from(affiliateConversionEvents)
      .where(
        and(
          eq(affiliateConversionEvents.offerKey, offer.id),
          eq(affiliateConversionEvents.status, "confirmed"),
          lte(affiliateConversionEvents.occurredAt, dueCutoff)
        )
      )
      .groupBy(affiliateConversionEvents.siteKey);

    const dueRevenue = roundCurrency(Number(dueTotals?.revenue ?? 0));
    const receiptsTotal = roundCurrency(Number(receiptTotals?.total ?? 0));
    const outstandingAmount = roundCurrency(Math.max(0, dueRevenue - receiptsTotal));
    const dueConversions = Number(dueTotals?.conversions ?? 0);
    const oldestOccurredAt = dueTotals?.oldestOccurredAt ?? null;
    const dueAt = oldestOccurredAt
      ? addDays(new Date(oldestOccurredAt), offer.ops.paymentTermsDays).toISOString()
      : null;
    const daysLate =
      dueAt && outstandingAmount > 0 ? diffInDays(now, new Date(dueAt)) : 0;

    const caseKey = `payout:${offer.id}`;
    const [existingCase] = await db
      .select()
      .from(payoutCases)
      .where(eq(payoutCases.caseKey, caseKey))
      .limit(1);

    if (outstandingAmount <= 0 || dueConversions === 0 || !oldestOccurredAt) {
      if (existingCase && !existingCase.resolvedAt) {
        await db
          .update(payoutCases)
          .set({
            status: "resolved",
            severity: "info",
            outstandingAmount: 0,
            dueConversions: 0,
            recommendedAction: "No action required.",
            resolvedAt: nowIso,
            updatedAt: nowIso,
          })
          .where(eq(payoutCases.caseKey, caseKey));

        await db.insert(policyEvents).values({
          siteKey: existingCase.siteKey ?? "bank_near_me",
          vertical: "finance",
          severity: "info",
          eventType: "payout_case_resolved",
          offerKey: offer.id,
          message: `${offer.brand} payout issue resolved or fully covered by receipts.`,
          metadataJson: JSON.stringify({ caseKey }),
          createdAt: nowIso,
        });

        if (autoPause) {
          await db
            .update(offerCatalog)
            .set({ status: offer.active ? "active" : "paused", updatedAt: nowIso })
            .where(eq(offerCatalog.offerKey, offer.id));
        }
      }
      continue;
    }

    const caseShape = getCaseStage({
      daysLate,
      gracePeriodDays: offer.ops.gracePeriodDays,
      pauseTrafficAfterDays: offer.ops.pauseTrafficAfterDays,
    });
    const fallbackOffer = getFallbackOffer(offer.id);
    const email = buildPartnerEmail({
      advertiser: offer.brand,
      stage: caseShape.stage,
      outstandingAmount,
      currency: "AUD",
      dueConversions,
      oldestOccurredAt,
      dueAt,
      fallbackAdvertiser: fallbackOffer.brand,
    });

    const siteKey = affectedSites[0]?.siteKey ?? "bank_near_me";
    const metadata = JSON.stringify({
      dueRevenue,
      receiptsTotal,
      affectedSites: affectedSites.map((site) => site.siteKey),
      paymentTermsDays: offer.ops.paymentTermsDays,
      gracePeriodDays: offer.ops.gracePeriodDays,
      pauseTrafficAfterDays: offer.ops.pauseTrafficAfterDays,
      fallbackOfferId: fallbackOffer.id,
    });

    const shouldEscalate =
      !existingCase ||
      existingCase.emailStage !== caseShape.stage ||
      existingCase.severity !== caseShape.severity ||
      existingCase.status !== caseShape.status;

    await db
      .insert(payoutCases)
      .values({
        caseKey,
        offerKey: offer.id,
        siteKey,
        status: caseShape.status,
        severity: caseShape.severity,
        outstandingAmount,
        currency: "AUD",
        dueConversions,
        oldestOccurredAt,
        dueAt,
        lastEscalatedAt: shouldEscalate ? nowIso : existingCase?.lastEscalatedAt ?? null,
        emailStage: caseShape.stage,
        partnerEmail,
        emailSubject: email.subject,
        emailBody: email.bodyText,
        recommendedAction: caseShape.recommendedAction,
        metadataJson: metadata,
        createdAt: existingCase?.createdAt ?? nowIso,
        updatedAt: nowIso,
        resolvedAt: null,
      })
      .onConflictDoUpdate({
        target: payoutCases.caseKey,
        set: {
          siteKey,
          status: caseShape.status,
          severity: caseShape.severity,
          outstandingAmount,
          currency: "AUD",
          dueConversions,
          oldestOccurredAt,
          dueAt,
          lastEscalatedAt: shouldEscalate ? nowIso : existingCase?.lastEscalatedAt ?? null,
          emailStage: caseShape.stage,
          partnerEmail,
          emailSubject: email.subject,
          emailBody: email.bodyText,
          recommendedAction: caseShape.recommendedAction,
          metadataJson: metadata,
          updatedAt: nowIso,
          resolvedAt: null,
        },
      });

    if (shouldEscalate) {
      await db.insert(policyEvents).values({
        siteKey,
        vertical: "finance",
        severity: caseShape.severity,
        eventType: "partner_payout_overdue",
        offerKey: offer.id,
        message: `${offer.brand} has ${dueConversions} due conversion(s) and $${outstandingAmount.toFixed(
          2
        )} outstanding. ${caseShape.recommendedAction}`,
        metadataJson: metadata,
        createdAt: nowIso,
      });
    }

    let emailSent = false;
    if (autoContact && partnerEmail && shouldEscalate) {
      emailSent = await sendPartnerPayoutEmail({
        to: partnerEmail,
        subject: email.subject,
        bodyText: email.bodyText,
      });
      if (emailSent) {
        contactedPartners.push(offer.brand);
      }
    }

    let pausedOffer = false;
    if (autoPause && caseShape.status === "paused" && offer.ops.autoPauseOnDelinquency) {
      await db
        .update(offerCatalog)
        .set({ status: "paused", updatedAt: nowIso })
        .where(eq(offerCatalog.offerKey, offer.id));
      pausedOffers.push(offer.id);
      pausedOffer = true;
    }

    cases.push({
      offerKey: offer.id,
      advertiser: offer.brand,
      network: offer.ops.network,
      partnerEmail,
      status: caseShape.status,
      severity: caseShape.severity,
      stage: caseShape.stage,
      dueConversions,
      dueRevenue,
      receiptsTotal,
      outstandingAmount,
      oldestOccurredAt,
      dueAt,
      recommendedAction: caseShape.recommendedAction,
      affectedSites: affectedSites.map((site) => site.siteKey),
      emailSent,
      pausedOffer,
    });
  }

  const run: PayoutAgentRunSummary = {
    runAt: nowIso,
    cases,
    totalOutstandingAmount: roundCurrency(
      cases.reduce((sum, item) => sum + item.outstandingAmount, 0)
    ),
    pausedOffers,
    contactedPartners,
  };

  if (cases.length > 0) {
    const summaryEmail = buildSummaryEmail(run);
    await sendPayoutOpsSummaryEmail(summaryEmail);
  }

  return run;
}
