export type VisitAdvisoryStatus = "good" | "caution" | "avoid";

export interface VisitAdvisoryReport {
  reportType: string;
  createdAt: string;
  branchName?: string | null;
  branchType?: string | null;
}

export interface VisitAdvisoryInput {
  scope: "suburb" | "atm" | "bank";
  placeLabel: string;
  openLocations: number;
  closedLocations?: number;
  fallbackLocations?: number;
  recentReports: VisitAdvisoryReport[];
}

export interface VisitAdvisory {
  status: VisitAdvisoryStatus;
  badge: string;
  title: string;
  summary: string;
  reasons: string[];
  actions: string[];
  stats: { label: string; value: string }[];
}

const STATUS_THEME: Record<
  VisitAdvisoryStatus,
  { badge: string; titlePrefix: string }
> = {
  good: {
    badge: "Good To Visit",
    titlePrefix: "Low-friction visit",
  },
  caution: {
    badge: "Use Caution",
    titlePrefix: "Check before you leave",
  },
  avoid: {
    badge: "High Risk Trip",
    titlePrefix: "Do not rely on a single visit",
  },
};

function getHoursAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) {
    return Number.POSITIVE_INFINITY;
  }

  return diff / (1000 * 60 * 60);
}

function countReports(
  reports: VisitAdvisoryReport[],
  reportType: string,
  withinHours: number
) {
  return reports.filter(
    (report) => report.reportType === reportType && getHoursAgo(report.createdAt) <= withinHours
  ).length;
}

function getMostRecentReport(
  reports: VisitAdvisoryReport[],
  reportType: string,
  withinHours: number
) {
  return reports.find(
    (report) => report.reportType === reportType && getHoursAgo(report.createdAt) <= withinHours
  );
}

function formatHoursAgo(iso: string) {
  const hours = getHoursAgo(iso);
  if (!Number.isFinite(hours)) {
    return "recently";
  }

  if (hours < 1) {
    return "within the last hour";
  }

  if (hours < 24) {
    return `${Math.round(hours)}h ago`;
  }

  return `${Math.round(hours / 24)}d ago`;
}

export function buildVisitAdvisory(input: VisitAdvisoryInput): VisitAdvisory {
  const atmEmpty24h = countReports(input.recentReports, "atm_empty", 24);
  const closureNotice14d = countReports(input.recentReports, "closure_notice", 24 * 14);
  const branchClosed7d = countReports(input.recentReports, "branch_closed", 24 * 7);
  const queue24h = countReports(input.recentReports, "long_queue", 24);
  const working24h = countReports(input.recentReports, "working", 24);
  const freshNegativeSignals = atmEmpty24h + closureNotice14d + branchClosed7d + queue24h;

  let status: VisitAdvisoryStatus = "good";

  if (
    (input.scope === "atm" && atmEmpty24h > 0 && input.openLocations <= 1) ||
    (input.openLocations === 0 && (branchClosed7d > 0 || closureNotice14d > 0)) ||
    (freshNegativeSignals >= 2 && input.fallbackLocations === 0)
  ) {
    status = "avoid";
  } else if (
    closureNotice14d > 0 ||
    branchClosed7d > 0 ||
    queue24h > 0 ||
    atmEmpty24h > 0 ||
    (input.closedLocations ?? 0) > 0
  ) {
    status = "caution";
  } else if (working24h === 0 && input.openLocations <= 1) {
    status = "caution";
  }

  const theme = STATUS_THEME[status];
  const reasons: string[] = [];
  const actions: string[] = [];

  const recentAtmOutage = getMostRecentReport(input.recentReports, "atm_empty", 24);
  const recentClosureNotice = getMostRecentReport(input.recentReports, "closure_notice", 24 * 14);
  const recentQueue = getMostRecentReport(input.recentReports, "long_queue", 24);
  const recentWorking = getMostRecentReport(input.recentReports, "working", 24);

  if (atmEmpty24h > 0) {
    reasons.push(
      `${atmEmpty24h} ATM-empty report${atmEmpty24h === 1 ? "" : "s"} in the last 24h${
        recentAtmOutage ? `, latest ${formatHoursAgo(recentAtmOutage.createdAt)}` : ""
      }.`
    );
  }

  if (closureNotice14d > 0) {
    reasons.push(
      `${closureNotice14d} closure notice signal${closureNotice14d === 1 ? "" : "s"} in the last 14 days${
        recentClosureNotice ? `, latest ${formatHoursAgo(recentClosureNotice.createdAt)}` : ""
      }.`
    );
  }

  if (branchClosed7d > 0) {
    reasons.push(
      `${branchClosed7d} permanent closure report${branchClosed7d === 1 ? "" : "s"} logged this week.`
    );
  }

  if (queue24h > 0) {
    reasons.push(
      `${queue24h} long-queue report${queue24h === 1 ? "" : "s"} in the last 24h${
        recentQueue ? `, latest ${formatHoursAgo(recentQueue.createdAt)}` : ""
      }.`
    );
  }

  if (working24h > 0) {
    reasons.push(
      `${working24h} positive working update${working24h === 1 ? "" : "s"} in the last 24h${
        recentWorking ? `, latest ${formatHoursAgo(recentWorking.createdAt)}` : ""
      }.`
    );
  }

  if (input.openLocations > 0) {
    reasons.push(
      `${input.openLocations} mapped ${
        input.openLocations === 1 ? "location remains" : "locations remain"
      } available right now.`
    );
  }

  if ((input.fallbackLocations ?? 0) > 0) {
    reasons.push(
      `${input.fallbackLocations} fallback option${
        input.fallbackLocations === 1 ? "" : "s"
      } if your first stop is bad.`
    );
  }

  if (reasons.length === 0) {
    reasons.push("There are not enough fresh community signals yet, so treat this as low-confidence local coverage.");
  }

  if ((input.closedLocations ?? 0) > 0 && status !== "avoid") {
    actions.push("Treat this area as mixed conditions rather than guaranteed service.");
  }

  if (status === "avoid") {
    actions.push("Choose a backup bank or suburb before leaving.");
    actions.push("Do not rely on a single ATM or branch for urgent cash or paperwork.");
    actions.push("If the trip matters, call the bank first and keep a second option ready.");
  } else if (status === "caution") {
    actions.push("Check the most recent community signal before leaving.");
    actions.push("Save a fallback ATM or branch in case this location is crowded or offline.");
    actions.push("If you can, avoid peak lunch-hour and end-of-day visits.");
  } else {
    actions.push("Conditions look relatively stable, but keep one fallback option saved.");
    actions.push("If you visit and conditions changed, submit a quick proof-backed report.");
  }

  if (actions.length === 0) {
    actions.push("Check local conditions again before leaving if this is a critical trip.");
  }

  const summary =
    status === "avoid"
      ? `${input.placeLabel} is showing enough negative local signal that you should assume the first trip may fail.`
      : status === "caution"
      ? `${input.placeLabel} has usable coverage, but there are enough recent community warnings that you should check conditions before leaving.`
      : `${input.placeLabel} currently looks usable based on local signals and available fallback coverage.`;

  return {
    status,
    badge: theme.badge,
    title: `${theme.titlePrefix} for ${input.placeLabel}`,
    summary,
    reasons: reasons.slice(0, 4),
    actions: actions.slice(0, 3),
    stats: [
      { label: "Open", value: String(input.openLocations) },
      { label: "Fresh Signals", value: String(freshNegativeSignals + working24h) },
      {
        label: "Fallbacks",
        value: String(input.fallbackLocations ?? 0),
      },
    ],
  };
}
