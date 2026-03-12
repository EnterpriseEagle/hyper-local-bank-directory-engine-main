import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  type BranchModerationTarget,
  type PreparedPhotoEvidence,
  type ReportPayload,
  type VisionAssessment,
} from "./types";

const VisionAssessmentSchema = z.object({
  authenticity: z.enum(["high", "medium", "low", "unclear"]),
  confidence: z.number().min(0).max(1),
  detected_signals: z.array(z.string()).max(8),
  manipulation_signals: z.array(z.string()).max(8),
  summary: z.string().min(1).max(500),
  supports_report: z.boolean().nullable(),
});

function openAIReportReviewEnabled() {
  return (
    process.env.ENABLE_OPENAI_REPORT_VISION?.trim().toLowerCase() === "true" &&
    Boolean(process.env.OPENAI_API_KEY?.trim())
  );
}

let openAIClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openAIReportReviewEnabled()) {
    return null;
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return openAIClient;
}

export async function reviewPhotoWithVision(input: {
  branch: BranchModerationTarget;
  photo: PreparedPhotoEvidence;
  payload: Pick<ReportPayload, "note" | "reportType">;
}): Promise<VisionAssessment | null> {
  const client = getOpenAIClient();
  if (!client || !input.photo.dataUrl) {
    return null;
  }

  try {
    const model = process.env.OPENAI_REPORT_REVIEW_MODEL?.trim() || "gpt-4.1-mini";
    const format = zodTextFormat(VisionAssessmentSchema, "report_photo_review");
    const response = await client.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You review community-submitted bank branch and ATM photos. " +
                "Assess whether the image visually supports the reported status and whether it looks like a normal camera photo. " +
                "Do not claim an image is authentic with certainty. If unsure, return uncertainty.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Reported status: ${input.payload.reportType}`,
                `Reporter note: ${input.payload.note || "None provided."}`,
                `Location: ${input.branch.bankName} ${input.branch.branchName}, ${input.branch.address}, ${input.branch.suburbName} ${input.branch.postcode}`,
                `Metadata summary: ${input.photo.metadata.summary}`,
                "Return structured JSON only.",
                "Look for bank branding, ATM error screens, closure signs, shutters, queue length, and whether the image appears like a real camera capture versus screenshot, render, or heavily edited media.",
              ].join("\n"),
            },
            {
              type: "input_image",
              detail: "auto",
              image_url: input.photo.dataUrl,
            },
          ],
        },
      ],
      max_output_tokens: 500,
      text: {
        format,
        verbosity: "low",
      },
    });

    const parsed = response.output_parsed as z.infer<typeof VisionAssessmentSchema> | null;
    if (!parsed) {
      return null;
    }

    return {
      authenticity: parsed.authenticity,
      confidence: parsed.confidence,
      detectedSignals: parsed.detected_signals,
      manipulationSignals: parsed.manipulation_signals,
      model,
      summary: parsed.summary,
      supportsReport: parsed.supports_report,
    };
  } catch (error) {
    console.error("[reports/openai-vision] Review failed:", error);
    return null;
  }
}
