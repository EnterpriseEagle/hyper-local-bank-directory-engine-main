import type {
  CommunityIncidentSummary,
  CommunityReportRecord,
  ModerationStatus,
  ReportType,
  ReporterTrustLevel,
  ReporterTrustSnapshot,
  SignalBadge,
} from "./types";

const INCIDENT_LOOKBACK_HOURS: Record<ReportType, number> = {
  working: 12,
  atm_empty: 24,
  branch_closed: 24 * 14,
  closure_notice: 24 * 21,
  long_queue: 12,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asTrustLevel(value: unknown): ReporterTrustLevel | null {
  if (value === "new" || value === "building" || value === "trusted" || value === "watch") {
    return value;
  }

  return null;
}

export function getHoursBetween(laterIso: string, earlierIso: string) {
  const later = new Date(laterIso).getTime();
  const earlier = new Date(earlierIso).getTime();

  if (!Number.isFinite(later) || !Number.isFinite(earlier)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(later - earlier) / (1000 * 60 * 60);
}

export function getIncidentLookbackHours(reportType: ReportType) {
  return INCIDENT_LOOKBACK_HOURS[reportType];
}

export function buildReporterTrustSnapshot(history: {
  approvedCount: number;
  rejectedCount: number;
}): ReporterTrustSnapshot {
  const approvedCount = Math.max(0, history.approvedCount);
  const rejectedCount = Math.max(0, history.rejectedCount);
  const totalReviewed = approvedCount + rejectedCount;

  if (totalReviewed === 0) {
    return {
      approvedCount,
      rejectedCount,
      score: 0.5,
      summary: "New reporter with no moderation history yet.",
      totalReviewed,
      level: "new",
    };
  }

  const accuracy = approvedCount / totalReviewed;
  let score =
    0.28 +
    accuracy * 0.5 +
    Math.min(approvedCount, 10) * 0.02 -
    Math.min(rejectedCount, 6) * 0.035;

  score = clamp(Number(score.toFixed(2)), 0.15, 0.95);

  let level: ReporterTrustLevel = "building";
  if (approvedCount >= 3 && accuracy >= 0.8 && score >= 0.74) {
    level = "trusted";
  } else if (rejectedCount >= 2 && rejectedCount > approvedCount && score <= 0.4) {
    level = "watch";
  }

  const accuracyPct = Math.round(accuracy * 100);
  const summary =
    level === "trusted"
      ? `${approvedCount} approved reports with ${accuracyPct}% moderation accuracy.`
      : level === "watch"
      ? `${rejectedCount} rejected reports versus ${approvedCount} approved.`
      : `${approvedCount} approved and ${rejectedCount} rejected reports so far.`;

  return {
    approvedCount,
    rejectedCount,
    score,
    summary,
    totalReviewed,
    level,
  };
}

export function getReporterTrustSnapshot(
  report: Pick<CommunityReportRecord, "photo_metadata_json">
): ReporterTrustSnapshot | null {
  const metadata = asObject(report.photo_metadata_json);
  const trust = asObject(metadata.reporterTrust);
  const level = asTrustLevel(trust.level);
  const score = asNumber(trust.score);
  const approvedCount = asNumber(trust.approvedCount);
  const rejectedCount = asNumber(trust.rejectedCount);
  const totalReviewed = asNumber(trust.totalReviewed);
  const summary = asString(trust.summary);

  if (
    !level ||
    score == null ||
    approvedCount == null ||
    rejectedCount == null ||
    totalReviewed == null ||
    !summary
  ) {
    return null;
  }

  return {
    approvedCount,
    rejectedCount,
    score,
    summary,
    totalReviewed,
    level,
  };
}

export function mergeReportMetadataContext(input: {
  photoMetadataJson?: Record<string, unknown> | null;
  reporterTrust?: ReporterTrustSnapshot | null;
}) {
  const next = {
    ...asObject(input.photoMetadataJson),
  };

  if (input.reporterTrust) {
    next.reporterTrust = input.reporterTrust;
  }

  return Object.keys(next).length > 0 ? next : null;
}

export function isProofBacked(report: Pick<CommunityReportRecord, "photo_path" | "photo_sha256">) {
  return Boolean(report.photo_path || report.photo_sha256);
}

function buildClusterKey(report: CommunityReportRecord) {
  const dayBucket = report.submitted_at.slice(0, 10);
  return `${report.branch_id}:${report.report_type}:${dayBucket}`;
}

export function groupCommunityReportsIntoIncidents(reports: CommunityReportRecord[]) {
  const sorted = [...reports].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );

  const clusters: Array<{
    key: string;
    branchId: number;
    suburbId: number;
    reportType: ReportType;
    latestSubmittedAt: string;
    reports: CommunityReportRecord[];
  }> = [];

  for (const report of sorted) {
    const lookbackHours = getIncidentLookbackHours(report.report_type);
    const existing = clusters.find(
      (cluster) =>
        cluster.branchId === report.branch_id &&
        cluster.reportType === report.report_type &&
        getHoursBetween(cluster.latestSubmittedAt, report.submitted_at) <= lookbackHours
    );

    if (existing) {
      existing.reports.push(report);
      continue;
    }

    clusters.push({
      key: buildClusterKey(report),
      branchId: report.branch_id,
      suburbId: report.suburb_id,
      reportType: report.report_type,
      latestSubmittedAt: report.submitted_at,
      reports: [report],
    });
  }

  return clusters;
}

function countByStatus(reports: CommunityReportRecord[], status: ModerationStatus) {
  return reports.filter((report) => report.moderation_status === status).length;
}

export function buildIncidentBadges(
  cluster: ReturnType<typeof groupCommunityReportsIntoIncidents>[number],
  mode: "admin" | "public"
): SignalBadge[] {
  const uniqueReporterCount = new Set(
    cluster.reports.map((report) => report.reporter_hash).filter(Boolean)
  ).size;
  const proofCount = cluster.reports.filter(isProofBacked).length;
  const trustedReporterCount = cluster.reports.filter((report) => {
    const trust = getReporterTrustSnapshot(report);
    return trust?.level === "trusted";
  }).length;
  const approvedCount = countByStatus(cluster.reports, "approved");

  const badges: SignalBadge[] = [];

  if (proofCount > 0) {
    badges.push({
      label:
        proofCount === 1 ? "Proof-backed" : `${proofCount} proof-backed`,
      tone: "blue",
    });
  }

  if (mode === "public") {
    if (approvedCount >= 2 && uniqueReporterCount >= 2) {
      badges.push({ label: "Multi-report confirmed", tone: "emerald" });
    } else if (cluster.reports.length >= 2) {
      badges.push({ label: `${cluster.reports.length} matching reports`, tone: "amber" });
    }
  } else {
    if (uniqueReporterCount >= 2) {
      badges.push({
        label: `${uniqueReporterCount} reporters`,
        tone: uniqueReporterCount >= 3 ? "emerald" : "amber",
      });
    } else if (cluster.reports.length >= 2) {
      badges.push({ label: `${cluster.reports.length} matching reports`, tone: "amber" });
    }
  }

  if (trustedReporterCount > 0) {
    badges.push({
      label: trustedReporterCount === 1 ? "Trusted reporter" : `${trustedReporterCount} trusted reporters`,
      tone: "emerald",
    });
  }

  return badges;
}

export function buildCommunityIncidentSummary(input: {
  branchName: string;
  branchType: string | null;
  cluster: ReturnType<typeof groupCommunityReportsIntoIncidents>[number];
}): CommunityIncidentSummary {
  const proofCount = input.cluster.reports.filter(isProofBacked).length;
  const uniqueReporterCount = new Set(
    input.cluster.reports.map((report) => report.reporter_hash).filter(Boolean)
  ).size;
  const trustedReporterCount = input.cluster.reports.filter((report) => {
    const trust = getReporterTrustSnapshot(report);
    return trust?.level === "trusted";
  }).length;

  return {
    badges: buildIncidentBadges(input.cluster, "public"),
    branchId: input.cluster.branchId,
    branchName: input.branchName,
    branchType: input.branchType,
    latestSubmittedAt: input.cluster.latestSubmittedAt,
    proofCount,
    reportType: input.cluster.reportType,
    suburbId: input.cluster.suburbId,
    totalReports: input.cluster.reports.length,
    trustedReporterCount,
    uniqueReporterCount,
  };
}
