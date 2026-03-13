import {
  type AgentAssessment,
  type ExtractedPhotoMetadata,
  type ReportPayload,
  type VisionAssessment,
} from "./types";

const POSITIVE_KEYWORDS = [
  "working",
  "open",
  "cash available",
  "operational",
  "queue moving",
] as const;

const NEGATIVE_KEYWORDS = [
  "closed",
  "closure notice",
  "closing soon",
  "closing",
  "final day",
  "notice posted",
  "shut",
  "out of service",
  "empty",
  "no cash",
  "broken",
  "offline",
  "queue",
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function countKeywordMatches(note: string, keywords: readonly string[]) {
  return keywords.reduce((count, keyword) => {
    return count + (note.includes(keyword) ? 1 : 0);
  }, 0);
}

export function assessIncomingReport(
  payload: Pick<ReportPayload, "reportType" | "note"> & { hasPhoto: boolean },
  evidence?: {
    photoMetadata?: ExtractedPhotoMetadata | null;
    vision?: VisionAssessment | null;
  }
): AgentAssessment {
  const note = payload.note?.trim().toLowerCase() ?? "";
  const positiveHits = countKeywordMatches(note, POSITIVE_KEYWORDS);
  const negativeHits = countKeywordMatches(note, NEGATIVE_KEYWORDS);
  const evidenceParts = [
    payload.hasPhoto ? "photo attached" : "no photo",
    note ? "reporter note supplied" : "no note",
    `${payload.reportType.replace("_", " ")} signal`,
  ];

  let confidence = 0.25;
  let recommendation: AgentAssessment["recommendation"] = "review";

  if (payload.hasPhoto) confidence += 0.3;
  if (note.length >= 25) confidence += 0.15;
  if (note.length >= 80) confidence += 0.05;

  if (payload.reportType === "branch_closed" || payload.reportType === "closure_notice") {
    confidence += 0.1;
  }
  if (payload.reportType === "working") confidence += 0.05;

  if (payload.reportType === "working") {
    confidence += positiveHits * 0.08;
    confidence -= negativeHits * 0.06;
  } else {
    confidence += negativeHits * 0.08;
    confidence -= positiveHits * 0.06;
  }

  if (!payload.hasPhoto && note.length < 20) {
    recommendation = "review";
  }

  if (evidence?.photoMetadata) {
    evidenceParts.push(evidence.photoMetadata.summary);

    if (evidence.photoMetadata.status === "present") confidence += 0.12;
    if (evidence.photoMetadata.status === "partial") confidence += 0.04;
    if (evidence.photoMetadata.status === "edited") confidence -= 0.2;
    if (evidence.photoMetadata.status === "missing") confidence -= 0.12;

    if (
      evidence.photoMetadata.captureDistanceKm != null &&
      evidence.photoMetadata.captureDistanceKm <= 5
    ) {
      confidence += 0.08;
    } else if (
      evidence.photoMetadata.captureDistanceKm != null &&
      evidence.photoMetadata.captureDistanceKm > 50
    ) {
      confidence -= 0.12;
    }
  }

  if (evidence?.vision) {
    evidenceParts.push(`vision ${evidence.vision.summary}`);
    confidence = confidence * 0.45 + evidence.vision.confidence * 0.55;

    if (evidence.vision.supportsReport === true) confidence += 0.12;
    if (evidence.vision.supportsReport === false) confidence -= 0.22;

    if (evidence.vision.authenticity === "high") confidence += 0.08;
    if (evidence.vision.authenticity === "medium") confidence += 0.03;
    if (evidence.vision.authenticity === "low") confidence -= 0.16;
  }

  confidence = clamp(Number(confidence.toFixed(2)), 0.05, 0.95);

  if (
    confidence >= 0.78 &&
    payload.reportType !== "branch_closed" &&
    evidence?.photoMetadata?.status !== "missing" &&
    evidence?.photoMetadata?.status !== "edited" &&
    evidence?.vision?.supportsReport !== false
  ) {
    recommendation = "approve";
  } else if (
    confidence <= 0.22 ||
    evidence?.vision?.supportsReport === false ||
    evidence?.photoMetadata?.status === "edited"
  ) {
    recommendation = "reject";
  }

  return {
    confidence,
    model: evidence?.vision?.model ?? null,
    recommendation,
    summary: `Heuristic review: ${evidenceParts.join(", ")}. Confidence ${Math.round(
      confidence * 100
    )}%.`,
  };
}
