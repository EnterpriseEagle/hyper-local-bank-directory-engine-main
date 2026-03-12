import { NextRequest, NextResponse } from "next/server";
import { getBranchModerationTargets, submitStatusReport } from "@/lib/data";
import { isRateLimited, getIpHash } from "@/lib/rate-limit";
import { statusReportsEnabled } from "@/lib/feature-flags";
import { assessIncomingReport } from "@/lib/reports/agent";
import { reviewPhotoWithVision } from "@/lib/reports/openai-vision";
import { preparePhotoEvidence } from "@/lib/reports/photo-metadata";
import { queueCommunityReport, supabaseReportsConfigured, uploadReportPhoto } from "@/lib/reports/supabase";
import { MAX_REPORT_NOTE_LENGTH, VALID_REPORT_TYPES, type ReportType } from "@/lib/reports/types";
import { revalidatePath } from "next/cache";

function normaliseNumber(value: FormDataEntryValue | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function parseRequestPayload(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const noteValue = formData.get("note");

    return {
      branchId: normaliseNumber(formData.get("branchId")),
      note:
        typeof noteValue === "string"
          ? noteValue.trim().slice(0, MAX_REPORT_NOTE_LENGTH)
          : undefined,
      photo: formData.get("photo"),
      reportType: formData.get("reportType"),
      suburbId: normaliseNumber(formData.get("suburbId")),
    };
  }

  const body = await request.json();
  return {
    branchId: normaliseNumber(body.branchId),
    note:
      typeof body.note === "string"
        ? body.note.trim().slice(0, MAX_REPORT_NOTE_LENGTH)
        : undefined,
    photo: null,
    reportType: body.reportType,
    suburbId: normaliseNumber(body.suburbId),
  };
}

async function revalidateReportPaths(branchId: number) {
  revalidatePath("/");
  revalidatePath("/closures");
  revalidatePath("/bank");
  revalidatePath("/atm");

  const [target] = await getBranchModerationTargets([branchId]);
  if (!target) {
    return;
  }

  revalidatePath(`/${target.stateSlug}/${target.suburbSlug}`);
  revalidatePath(`/bank/${target.bankSlug}/${target.stateSlug}/${target.suburbSlug}`);
  revalidatePath(`/atm/${target.suburbSlug}`);
}

export async function POST(request: NextRequest) {
  if (!statusReportsEnabled) {
    return NextResponse.json({ error: "Status reporting is not enabled yet." }, { status: 503 });
  }

  try {
    const ipHash = getIpHash(request);

    // Rate limit: max 5 reports per minute per IP
    if (isRateLimited(`report:${ipHash}`, 5, 60_000)) {
      return NextResponse.json({ error: "Too many reports. Try again later." }, { status: 429 });
    }

    const body = await parseRequestPayload(request);
    const { branchId, suburbId, reportType, note, photo } = body;

    if (!branchId || !suburbId || !reportType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (typeof reportType !== "string" || !VALID_REPORT_TYPES.includes(reportType as ReportType)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    if (typeof branchId !== "number" || typeof suburbId !== "number") {
      return NextResponse.json({ error: "Invalid field types" }, { status: 400 });
    }

    const uploadedPhoto = photo instanceof File && photo.size > 0 ? photo : null;

    if (supabaseReportsConfigured()) {
      const [branchTarget] = await getBranchModerationTargets([branchId]);
      if (!branchTarget) {
        return NextResponse.json({ error: "Branch not found" }, { status: 404 });
      }

      const preparedPhoto = uploadedPhoto
        ? await preparePhotoEvidence(uploadedPhoto, branchTarget)
        : null;
      const visionReview = preparedPhoto
        ? await reviewPhotoWithVision({
            branch: branchTarget,
            photo: preparedPhoto,
            payload: {
              note,
              reportType: reportType as ReportType,
            },
          })
        : null;
      const assessment = assessIncomingReport({
        hasPhoto: Boolean(preparedPhoto),
        note,
        reportType: reportType as ReportType,
      }, {
        photoMetadata: preparedPhoto?.metadata,
        vision: visionReview,
      });

      const storedPhoto = preparedPhoto
        ? await uploadReportPhoto({
            branchId,
            suburbId,
            buffer: preparedPhoto.buffer,
            file: preparedPhoto.file,
          })
        : null;

      await queueCommunityReport({
        assessment,
        payload: {
          branchId: Number(branchId),
          suburbId: Number(suburbId),
          reportType: reportType as ReportType,
          note,
          ipHash,
        },
        photoMetadata: preparedPhoto?.metadata,
        uploadedPhoto: storedPhoto,
        vision: visionReview,
      });

      return NextResponse.json({
        queued: true,
        message:
          "Report received. It is now in the review queue and will only change live data after approval.",
      });
    }

    if (note || uploadedPhoto) {
      return NextResponse.json(
        {
          error:
            "Photo evidence is not configured yet. Add Supabase report storage to enable uploads.",
        },
        { status: 503 }
      );
    }

    await submitStatusReport({
      branchId: Number(branchId),
      suburbId: Number(suburbId),
      reportType,
      ipHash,
    });

    await revalidateReportPaths(branchId);

    return NextResponse.json({ success: true, message: "Report submitted. Thank you!" });
  } catch (err) {
    console.error("[report] Failed to submit:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to submit report" },
      { status: 500 }
    );
  }
}
