export const VALID_REPORT_TYPES = [
  "working",
  "atm_empty",
  "branch_closed",
  "closure_notice",
  "long_queue",
] as const;

export const MAX_REPORT_NOTE_LENGTH = 500;
export const MAX_REPORT_IMAGE_BYTES = 8 * 1024 * 1024;
export const COMMUNITY_REPORTS_TABLE = "community_reports";
export const DEFAULT_REPORTS_BUCKET = "report-photos";

export type ReportType = (typeof VALID_REPORT_TYPES)[number];
export type AgentRecommendation = "approve" | "review" | "reject";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type PhotoMetadataStatus = "missing" | "partial" | "present" | "edited";
export type VisionAuthenticity = "high" | "medium" | "low" | "unclear";

export interface ReportPayload {
  branchId: number;
  suburbId: number;
  reportType: ReportType;
  note?: string;
  ipHash?: string;
}

export interface AgentAssessment {
  confidence: number;
  recommendation: AgentRecommendation;
  summary: string;
  model: string | null;
}

export interface UploadedPhoto {
  bucket: string;
  contentType: string | null;
  path: string;
}

export interface BranchModerationTarget {
  address: string;
  bankName: string;
  bankSlug: string;
  branchId: number;
  branchName: string;
  branchStatus: string;
  branchType: string;
  lat: number;
  lng: number;
  postcode: string;
  stateSlug: string;
  suburbName: string;
  suburbSlug: string;
}

export interface ExtractedPhotoMetadata {
  cameraMake: string | null;
  cameraModel: string | null;
  cameraSoftware: string | null;
  capturedAt: string | null;
  captureDistanceKm: number | null;
  captureLat: number | null;
  captureLng: number | null;
  fileName: string | null;
  height: number | null;
  mimeType: string | null;
  sha256: string;
  sizeBytes: number;
  status: PhotoMetadataStatus;
  summary: string;
  width: number | null;
}

export interface PreparedPhotoEvidence {
  buffer: Buffer;
  dataUrl: string | null;
  file: File;
  metadata: ExtractedPhotoMetadata;
}

export interface VisionAssessment {
  authenticity: VisionAuthenticity;
  confidence: number;
  detectedSignals: string[];
  manipulationSignals: string[];
  model: string;
  summary: string;
  supportsReport: boolean | null;
}

export interface CommunityReportRecord {
  id: string;
  branch_id: number;
  suburb_id: number;
  report_type: ReportType;
  note: string | null;
  photo_path: string | null;
  photo_bucket: string | null;
  photo_content_type: string | null;
  photo_sha256: string | null;
  photo_size_bytes: number | null;
  photo_width: number | null;
  photo_height: number | null;
  photo_metadata_status: PhotoMetadataStatus | null;
  photo_metadata_summary: string | null;
  photo_metadata_json: Record<string, unknown> | null;
  camera_make: string | null;
  camera_model: string | null;
  camera_software: string | null;
  captured_at: string | null;
  capture_lat: number | null;
  capture_lng: number | null;
  capture_distance_km: number | null;
  vision_model: string | null;
  vision_summary: string | null;
  vision_confidence: number | null;
  vision_supports_report: boolean | null;
  vision_authenticity: VisionAuthenticity | null;
  reporter_hash: string | null;
  source: string;
  agent_summary: string | null;
  agent_confidence: number | null;
  agent_recommendation: AgentRecommendation | null;
  moderation_status: ModerationStatus;
  moderation_note: string | null;
  moderated_at: string | null;
  moderated_by: string | null;
  submitted_at: string;
  synced_at: string | null;
}
