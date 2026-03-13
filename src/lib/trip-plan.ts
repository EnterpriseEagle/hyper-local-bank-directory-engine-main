import type { CommunityIncidentSummary, SignalBadge } from "@/lib/reports/types";

export interface TripPlanLocation {
  address: string;
  bankName?: string;
  feeRating?: string | null;
  id: number;
  name: string;
  openingHours?: string | null;
  status: string;
  type: "branch" | "atm";
}

export interface TripPlanNearbySuburb {
  name: string;
  postcode: string;
  slug: string;
  stateSlug: string;
}

export interface TripPlanItem {
  badges: SignalBadge[];
  ctaLabel?: string;
  href?: string;
  summary: string;
  title: string;
  tone: "good" | "neutral" | "warn";
}

export interface TripPlan {
  items: TripPlanItem[];
  summary: string;
  title: string;
}

interface TripPlanInput {
  incidents: CommunityIncidentSummary[];
  locations: TripPlanLocation[];
  nearbySuburbs?: TripPlanNearbySuburb[];
  placeLabel: string;
  scope: "suburb" | "atm" | "bank";
}

function formatReportType(reportType: string) {
  return reportType
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDirectionsHref(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function getIncidentPenalty(incident: CommunityIncidentSummary) {
  const severity =
    incident.reportType === "branch_closed"
      ? -9
      : incident.reportType === "closure_notice"
      ? -6
      : incident.reportType === "atm_empty"
      ? -6
      : incident.reportType === "long_queue"
      ? -3
      : incident.reportType === "working"
      ? 2
      : 0;

  const evidenceBoost =
    incident.badges.some((badge) => badge.label === "Proof-backed") ||
    incident.badges.some((badge) => badge.label.includes("proof-backed"))
      ? 1
      : 0;
  const clusterBoost = incident.totalReports >= 2 ? 1 : 0;

  if (severity < 0) {
    return severity - evidenceBoost - clusterBoost;
  }

  return severity + evidenceBoost;
}

function buildIncidentMap(incidents: CommunityIncidentSummary[]) {
  const map = new Map<number, CommunityIncidentSummary[]>();

  for (const incident of incidents) {
    const current = map.get(incident.branchId) ?? [];
    current.push(incident);
    map.set(incident.branchId, current);
  }

  return map;
}

function buildLocationScore(
  location: TripPlanLocation,
  incidents: CommunityIncidentSummary[],
  preferredType?: "branch" | "atm"
) {
  let score = location.status === "open" ? 10 : -20;

  if (preferredType && location.type === preferredType) {
    score += 3;
  }

  if (location.type === "branch" && location.openingHours) {
    score += 1;
  }

  if (location.type === "atm") {
    if (location.feeRating === "none") score += 1.5;
    if (location.feeRating === "low") score += 0.5;
    if (location.feeRating === "high") score -= 1;
  }

  for (const incident of incidents) {
    score += getIncidentPenalty(incident);
  }

  return score;
}

function describeLocationRisk(location: TripPlanLocation, incidents: CommunityIncidentSummary[]) {
  const worstNegative = incidents
    .filter((incident) => getIncidentPenalty(incident) < 0)
    .sort((a, b) => getIncidentPenalty(a) - getIncidentPenalty(b))[0];

  if (!worstNegative) {
    return `${location.name} currently has no approved negative incident cluster attached to it.`;
  }

  return `${formatReportType(worstNegative.reportType)} signal approved here with ${
    worstNegative.totalReports
  } matching report${worstNegative.totalReports === 1 ? "" : "s"}.`;
}

function buildLocationItem(input: {
  incidents: CommunityIncidentSummary[];
  label: string;
  location: TripPlanLocation;
  tone: "good" | "neutral" | "warn";
}) {
  const toneSummary =
    input.tone === "good"
      ? `${input.location.type === "atm" ? "Best cash option" : "Best first stop"} right now.`
      : input.tone === "warn"
      ? `Do not make this your first stop right now.`
      : `Keep this saved as a backup.`;

  return {
    badges: input.incidents.flatMap((incident) => incident.badges).slice(0, 3),
    ctaLabel: input.tone === "warn" ? "View directions anyway" : "Open directions",
    href: getDirectionsHref(input.location.address),
    summary: `${toneSummary} ${describeLocationRisk(input.location, input.incidents)}`,
    title: `${input.label}: ${input.location.name}`,
    tone: input.tone,
  } satisfies TripPlanItem;
}

function pickBestLocation(
  locations: TripPlanLocation[],
  incidentMap: Map<number, CommunityIncidentSummary[]>,
  preferredType?: "branch" | "atm",
  excludeIds: number[] = []
) {
  return [...locations]
    .filter((location) => location.status === "open" && !excludeIds.includes(location.id))
    .sort((a, b) => {
      const scoreA = buildLocationScore(a, incidentMap.get(a.id) ?? [], preferredType);
      const scoreB = buildLocationScore(b, incidentMap.get(b.id) ?? [], preferredType);
      return scoreB - scoreA;
    })[0];
}

function pickWorstLocation(
  locations: TripPlanLocation[],
  incidentMap: Map<number, CommunityIncidentSummary[]>
) {
  return [...locations]
    .filter((location) => (incidentMap.get(location.id) ?? []).some((incident) => getIncidentPenalty(incident) < 0))
    .sort((a, b) => {
      const scoreA = buildLocationScore(a, incidentMap.get(a.id) ?? []);
      const scoreB = buildLocationScore(b, incidentMap.get(b.id) ?? []);
      return scoreA - scoreB;
    })[0];
}

function buildSuburbPlan(input: TripPlanInput, incidentMap: Map<number, CommunityIncidentSummary[]>) {
  const items: TripPlanItem[] = [];
  const bestBranch = pickBestLocation(input.locations, incidentMap, "branch");
  const bestAtm = pickBestLocation(input.locations, incidentMap, "atm");
  const avoid = pickWorstLocation(input.locations, incidentMap);

  if (bestBranch) {
    items.push(
      buildLocationItem({
        incidents: incidentMap.get(bestBranch.id) ?? [],
        label: "Best Branch",
        location: bestBranch,
        tone: "good",
      })
    );
  }

  if (bestAtm) {
    items.push(
      buildLocationItem({
        incidents: incidentMap.get(bestAtm.id) ?? [],
        label: "Best ATM",
        location: bestAtm,
        tone: items.length === 0 ? "good" : "neutral",
      })
    );
  } else if (input.nearbySuburbs?.[0]) {
    const nearby = input.nearbySuburbs[0];
    items.push({
      badges: [],
      ctaLabel: "Open nearby suburb",
      href: `/${nearby.stateSlug}/${nearby.slug}`,
      summary: `If your local options look thin, open ${nearby.name} ${nearby.postcode} as the fastest nearby fallback coverage check.`,
      title: `Backup Area: ${nearby.name} ${nearby.postcode}`,
      tone: "neutral",
    });
  }

  if (avoid) {
    items.push(
      buildLocationItem({
        incidents: incidentMap.get(avoid.id) ?? [],
        label: "Avoid First",
        location: avoid,
        tone: "warn",
      })
    );
  } else if (input.nearbySuburbs?.[0] && items.length < 3) {
    const nearby = input.nearbySuburbs[0];
    items.push({
      badges: [],
      ctaLabel: "Open nearby suburb",
      href: `/${nearby.stateSlug}/${nearby.slug}`,
      summary: `Keep ${nearby.name} ${nearby.postcode} saved as your next suburb-level fallback if the first location disappoints.`,
      title: `Backup Suburb: ${nearby.name} ${nearby.postcode}`,
      tone: "neutral",
    });
  }

  return items.slice(0, 3);
}

function buildAtmPlan(input: TripPlanInput, incidentMap: Map<number, CommunityIncidentSummary[]>) {
  const items: TripPlanItem[] = [];
  const bestAtm = pickBestLocation(input.locations, incidentMap, "atm");
  const backupAtm = bestAtm
    ? pickBestLocation(input.locations, incidentMap, "atm", [bestAtm.id])
    : pickBestLocation(input.locations, incidentMap, "atm");
  const avoid = pickWorstLocation(input.locations, incidentMap);

  if (bestAtm) {
    items.push(
      buildLocationItem({
        incidents: incidentMap.get(bestAtm.id) ?? [],
        label: "Start Here",
        location: bestAtm,
        tone: "good",
      })
    );
  }

  if (backupAtm) {
    items.push(
      buildLocationItem({
        incidents: incidentMap.get(backupAtm.id) ?? [],
        label: "Backup ATM",
        location: backupAtm,
        tone: "neutral",
      })
    );
  } else if (input.nearbySuburbs?.[0]) {
    const nearby = input.nearbySuburbs[0];
    items.push({
      badges: [],
      ctaLabel: "Check nearby suburb",
      href: `/${nearby.stateSlug}/${nearby.slug}`,
      summary: `If cash access matters, keep ${nearby.name} ${nearby.postcode} saved as the nearest suburb-level fallback.`,
      title: `Fallback Area: ${nearby.name} ${nearby.postcode}`,
      tone: "neutral",
    });
  }

  if (avoid) {
    items.push(
      buildLocationItem({
        incidents: incidentMap.get(avoid.id) ?? [],
        label: "Avoid First",
        location: avoid,
        tone: "warn",
      })
    );
  }

  return items.slice(0, 3);
}

function buildBankPlan(input: TripPlanInput, incidentMap: Map<number, CommunityIncidentSummary[]>) {
  const items: TripPlanItem[] = [];
  const bestLocation = pickBestLocation(input.locations, incidentMap, "branch");
  const backupLocation = bestLocation
    ? pickBestLocation(input.locations, incidentMap, undefined, [bestLocation.id])
    : pickBestLocation(input.locations, incidentMap);
  const avoid = pickWorstLocation(input.locations, incidentMap);

  if (bestLocation) {
    items.push(
      buildLocationItem({
        incidents: incidentMap.get(bestLocation.id) ?? [],
        label: "Best First Stop",
        location: bestLocation,
        tone: "good",
      })
    );
  }

  if (backupLocation) {
    items.push(
      buildLocationItem({
        incidents: incidentMap.get(backupLocation.id) ?? [],
        label: "Backup Option",
        location: backupLocation,
        tone: "neutral",
      })
    );
  }

  if (avoid) {
    items.push(
      buildLocationItem({
        incidents: incidentMap.get(avoid.id) ?? [],
        label: "Call First / Avoid First",
        location: avoid,
        tone: "warn",
      })
    );
  }

  return items.slice(0, 3);
}

export function buildTripPlan(input: TripPlanInput): TripPlan | null {
  if (input.locations.length === 0) {
    return null;
  }

  const incidentMap = buildIncidentMap(input.incidents);

  const items =
    input.scope === "suburb"
      ? buildSuburbPlan(input, incidentMap)
      : input.scope === "atm"
      ? buildAtmPlan(input, incidentMap)
      : buildBankPlan(input, incidentMap);

  if (items.length === 0) {
    return null;
  }

  return {
    items,
    summary:
      "Auto-ranked from live status, approved incident clusters, proof-backed reports, and built-in fallback coverage.",
    title:
      input.scope === "atm"
        ? `Best ATM move in ${input.placeLabel}`
        : input.scope === "bank"
        ? `Best ${input.placeLabel} move right now`
        : `Best move before you leave for ${input.placeLabel}`,
  };
}
