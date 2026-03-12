import "server-only";

import { createHash } from "crypto";
import exifr from "exifr";
import {
  type BranchModerationTarget,
  type ExtractedPhotoMetadata,
  type PreparedPhotoEvidence,
} from "./types";

const EDITING_SOFTWARE_PATTERNS = [
  "photoshop",
  "lightroom",
  "snapseed",
  "canva",
  "picsart",
  "facetune",
  "gimp",
  "pixelmator",
] as const;

const VISION_SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function toFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toIsoString(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  return null;
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function resolveMetadataStatus(input: {
  cameraMake: string | null;
  cameraModel: string | null;
  cameraSoftware: string | null;
  capturedAt: string | null;
  captureLat: number | null;
  captureLng: number | null;
}) {
  const hasCoreDetails = Boolean(
    input.cameraMake || input.cameraModel || input.capturedAt || input.captureLat || input.captureLng
  );

  if (!hasCoreDetails) {
    return "missing" as const;
  }

  const software = input.cameraSoftware?.toLowerCase() ?? "";
  if (EDITING_SOFTWARE_PATTERNS.some((pattern) => software.includes(pattern))) {
    return "edited" as const;
  }

  if (input.cameraMake && input.cameraModel && input.capturedAt) {
    return "present" as const;
  }

  return "partial" as const;
}

function buildMetadataSummary(metadata: {
  cameraMake: string | null;
  cameraModel: string | null;
  cameraSoftware: string | null;
  capturedAt: string | null;
  captureDistanceKm: number | null;
  captureLat: number | null;
  captureLng: number | null;
  status: ExtractedPhotoMetadata["status"];
}) {
  const parts: string[] = [];

  if (metadata.cameraMake || metadata.cameraModel) {
    parts.push(
      `${metadata.cameraMake ?? ""} ${metadata.cameraModel ?? ""}`.trim()
    );
  } else {
    parts.push("device unknown");
  }

  if (metadata.capturedAt) {
    parts.push(`captured ${new Date(metadata.capturedAt).toLocaleString("en-AU")}`);
  } else {
    parts.push("capture time missing");
  }

  if (metadata.captureDistanceKm != null) {
    parts.push(`${metadata.captureDistanceKm.toFixed(1)}km from branch`);
  } else if (metadata.captureLat != null && metadata.captureLng != null) {
    parts.push("GPS present");
  } else {
    parts.push("no GPS");
  }

  if (metadata.cameraSoftware) {
    parts.push(`software ${metadata.cameraSoftware}`);
  }

  parts.push(`metadata ${metadata.status}`);
  return parts.join(" • ");
}

export async function preparePhotoEvidence(
  file: File,
  branch: BranchModerationTarget | null
): Promise<PreparedPhotoEvidence> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = (await exifr.parse(buffer).catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const cameraMake =
    typeof parsed?.Make === "string" ? parsed.Make.trim() || null : null;
  const cameraModel =
    typeof parsed?.Model === "string" ? parsed.Model.trim() || null : null;
  const cameraSoftware =
    typeof parsed?.Software === "string" ? parsed.Software.trim() || null : null;
  const capturedAt =
    toIsoString(parsed?.DateTimeOriginal) ??
    toIsoString(parsed?.CreateDate) ??
    toIsoString(parsed?.ModifyDate);
  const captureLat = toFiniteNumber(parsed?.latitude ?? parsed?.Latitude);
  const captureLng = toFiniteNumber(parsed?.longitude ?? parsed?.Longitude);
  const width =
    toFiniteNumber(parsed?.ExifImageWidth) ??
    toFiniteNumber(parsed?.ImageWidth) ??
    null;
  const height =
    toFiniteNumber(parsed?.ExifImageHeight) ??
    toFiniteNumber(parsed?.ImageHeight) ??
    null;

  const captureDistanceKm =
    branch && captureLat != null && captureLng != null
      ? round(haversineKm(branch.lat, branch.lng, captureLat, captureLng))
      : null;

  const status = resolveMetadataStatus({
    cameraMake,
    cameraModel,
    cameraSoftware,
    capturedAt,
    captureLat,
    captureLng,
  });

  const metadata: ExtractedPhotoMetadata = {
    cameraMake,
    cameraModel,
    cameraSoftware,
    capturedAt,
    captureDistanceKm,
    captureLat,
    captureLng,
    fileName: file.name || null,
    height,
    mimeType: file.type || null,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    sizeBytes: file.size,
    status,
    summary: buildMetadataSummary({
      cameraMake,
      cameraModel,
      cameraSoftware,
      capturedAt,
      captureDistanceKm,
      captureLat,
      captureLng,
      status,
    }),
    width,
  };

  return {
    buffer,
    dataUrl: VISION_SUPPORTED_MIME_TYPES.has(file.type)
      ? `data:${file.type};base64,${buffer.toString("base64")}`
      : null,
    file,
    metadata,
  };
}
