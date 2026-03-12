import "server-only";

import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { submitStatusReport } from "@/lib/data";
import {
  COMMUNITY_REPORTS_TABLE,
  DEFAULT_REPORTS_BUCKET,
  MAX_REPORT_IMAGE_BYTES,
  MAX_REPORT_NOTE_LENGTH,
  type AgentAssessment,
  type CommunityReportRecord,
  type ExtractedPhotoMetadata,
  type ModerationStatus,
  type ReportPayload,
  type UploadedPhoto,
  type VisionAssessment,
} from "./types";

const REPORT_SELECT_FIELDS = [
  "id",
  "branch_id",
  "suburb_id",
  "report_type",
  "note",
  "photo_path",
  "photo_bucket",
  "photo_content_type",
  "photo_sha256",
  "photo_size_bytes",
  "photo_width",
  "photo_height",
  "photo_metadata_status",
  "photo_metadata_summary",
  "photo_metadata_json",
  "camera_make",
  "camera_model",
  "camera_software",
  "captured_at",
  "capture_lat",
  "capture_lng",
  "capture_distance_km",
  "vision_model",
  "vision_summary",
  "vision_confidence",
  "vision_supports_report",
  "vision_authenticity",
  "reporter_hash",
  "source",
  "agent_summary",
  "agent_confidence",
  "agent_recommendation",
  "moderation_status",
  "moderation_note",
  "moderated_at",
  "moderated_by",
  "submitted_at",
  "synced_at",
].join(",");

function getSupabaseReportsConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_REPORTS_BUCKET?.trim() || DEFAULT_REPORTS_BUCKET;

  return {
    bucket,
    serviceRoleKey,
    url,
  };
}

export function supabaseReportsConfigured() {
  const config = getSupabaseReportsConfig();
  return Boolean(config.url && config.serviceRoleKey);
}

function getSupabaseReportsAdminClient() {
  const config = getSupabaseReportsConfig();
  if (!config.url || !config.serviceRoleKey) {
    throw new Error("Supabase report storage is not configured.");
  }

  return {
    bucket: config.bucket,
    client: createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

function normaliseNote(note?: string) {
  const trimmed = note?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, MAX_REPORT_NOTE_LENGTH);
}

function assertImageFile(file: File) {
  if (file.size > MAX_REPORT_IMAGE_BYTES) {
    throw new Error("Photo must be 8MB or smaller.");
  }

  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("Only image uploads are allowed.");
  }
}

export async function uploadReportPhoto(
  input: {
    branchId: number;
    suburbId: number;
    file: File;
    buffer: Buffer;
  }
): Promise<UploadedPhoto> {
  assertImageFile(input.file);

  const { bucket, client } = getSupabaseReportsAdminClient();
  const fileExt = input.file.name.includes(".")
    ? input.file.name.split(".").pop()
    : "jpg";
  const path = `branch-${input.branchId}/suburb-${input.suburbId}/${Date.now()}-${randomUUID()}.${fileExt}`;

  const { error } = await client.storage.from(bucket).upload(path, input.buffer, {
    contentType: input.file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(`Failed to upload report photo: ${error.message}`);
  }

  return {
    bucket,
    contentType: input.file.type || null,
    path,
  };
}

export async function queueCommunityReport(input: {
  payload: ReportPayload;
  assessment: AgentAssessment;
  photoMetadata?: ExtractedPhotoMetadata | null;
  uploadedPhoto?: UploadedPhoto | null;
  vision?: VisionAssessment | null;
}) {
  const { client } = getSupabaseReportsAdminClient();
  const note = normaliseNote(input.payload.note);

  const row = {
    agent_confidence: input.assessment.confidence,
    agent_recommendation: input.assessment.recommendation,
    agent_summary: input.assessment.summary,
    branch_id: input.payload.branchId,
    moderation_status: "pending" satisfies ModerationStatus,
    note: note ?? null,
    photo_bucket: input.uploadedPhoto?.bucket ?? null,
    photo_content_type: input.uploadedPhoto?.contentType ?? null,
    photo_height: input.photoMetadata?.height ?? null,
    photo_metadata_json: input.photoMetadata
      ? {
          cameraMake: input.photoMetadata.cameraMake,
          cameraModel: input.photoMetadata.cameraModel,
          cameraSoftware: input.photoMetadata.cameraSoftware,
          capturedAt: input.photoMetadata.capturedAt,
          captureDistanceKm: input.photoMetadata.captureDistanceKm,
          captureLat: input.photoMetadata.captureLat,
          captureLng: input.photoMetadata.captureLng,
          fileName: input.photoMetadata.fileName,
          height: input.photoMetadata.height,
          mimeType: input.photoMetadata.mimeType,
          sha256: input.photoMetadata.sha256,
          sizeBytes: input.photoMetadata.sizeBytes,
          status: input.photoMetadata.status,
          summary: input.photoMetadata.summary,
          width: input.photoMetadata.width,
        }
      : null,
    photo_metadata_status: input.photoMetadata?.status ?? null,
    photo_metadata_summary: input.photoMetadata?.summary ?? null,
    photo_path: input.uploadedPhoto?.path ?? null,
    photo_sha256: input.photoMetadata?.sha256 ?? null,
    photo_size_bytes: input.photoMetadata?.sizeBytes ?? null,
    photo_width: input.photoMetadata?.width ?? null,
    report_type: input.payload.reportType,
    reporter_hash: input.payload.ipHash ?? null,
    source: "web",
    submitted_at: new Date().toISOString(),
    suburb_id: input.payload.suburbId,
    camera_make: input.photoMetadata?.cameraMake ?? null,
    camera_model: input.photoMetadata?.cameraModel ?? null,
    camera_software: input.photoMetadata?.cameraSoftware ?? null,
    captured_at: input.photoMetadata?.capturedAt ?? null,
    capture_lat: input.photoMetadata?.captureLat ?? null,
    capture_lng: input.photoMetadata?.captureLng ?? null,
    capture_distance_km: input.photoMetadata?.captureDistanceKm ?? null,
    vision_authenticity: input.vision?.authenticity ?? null,
    vision_confidence: input.vision?.confidence ?? null,
    vision_model: input.vision?.model ?? null,
    vision_summary: input.vision?.summary ?? null,
    vision_supports_report: input.vision?.supportsReport ?? null,
  };

  const { data, error } = await client
    .from(COMMUNITY_REPORTS_TABLE)
    .insert(row)
    .select(REPORT_SELECT_FIELDS)
    .single();

  if (error) {
    throw new Error(`Failed to queue report: ${error.message}`);
  }

  return data as unknown as CommunityReportRecord;
}

export async function listCommunityReportsByStatus(
  statuses: ModerationStatus[],
  limit = 25
) {
  const { client } = getSupabaseReportsAdminClient();
  const { data, error } = await client
    .from(COMMUNITY_REPORTS_TABLE)
    .select(REPORT_SELECT_FIELDS)
    .in("moderation_status", statuses)
    .order("submitted_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load community reports: ${error.message}`);
  }

  return (data ?? []) as unknown as CommunityReportRecord[];
}

export async function createSignedReportPhotoUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 60 * 60
) {
  const { client } = getSupabaseReportsAdminClient();
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw new Error(`Failed to sign report photo: ${error.message}`);
  }

  return data.signedUrl;
}

export async function moderateCommunityReport(input: {
  action: "approved" | "rejected";
  moderator: string;
  moderationNote?: string;
  reportId: string;
}) {
  const { client } = getSupabaseReportsAdminClient();
  const { data, error } = await client
    .from(COMMUNITY_REPORTS_TABLE)
    .select(REPORT_SELECT_FIELDS)
    .eq("id", input.reportId)
    .single();

  if (error || !data) {
    throw new Error("Report not found.");
  }

  const report = data as unknown as CommunityReportRecord;
  const now = new Date().toISOString();
  const moderationNote = normaliseNote(input.moderationNote);
  let syncedAt = report.synced_at;

  if (input.action === "approved" && !report.synced_at) {
    await submitStatusReport({
      branchId: report.branch_id,
      suburbId: report.suburb_id,
      reportType: report.report_type,
      ipHash: report.reporter_hash ?? undefined,
    });
    syncedAt = now;
  }

  const { data: updated, error: updateError } = await client
    .from(COMMUNITY_REPORTS_TABLE)
    .update({
      moderated_at: now,
      moderated_by: input.moderator.slice(0, 80),
      moderation_note: moderationNote ?? null,
      moderation_status: input.action,
      synced_at: syncedAt,
    })
    .eq("id", input.reportId)
    .select(REPORT_SELECT_FIELDS)
    .single();

  if (updateError) {
    throw new Error(`Failed to moderate report: ${updateError.message}`);
  }

  return updated as unknown as CommunityReportRecord;
}
