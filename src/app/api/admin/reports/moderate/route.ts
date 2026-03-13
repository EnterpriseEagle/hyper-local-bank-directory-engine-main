import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { authorizeReportsAdminRequest } from "@/lib/reports/auth";
import { moderateCommunityReport, moderateCommunityReports } from "@/lib/reports/supabase";
import { getBranchModerationTargets } from "@/lib/data";

export async function POST(request: NextRequest) {
  if (!(await authorizeReportsAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const reportId = formData.get("reportId");
    const reportIds = formData.get("reportIds");
    const action = formData.get("action");
    const moderationNote = formData.get("moderationNote");
    const moderator = formData.get("moderator");
    const scope = formData.get("scope");

    if (
      (action !== "approved" && action !== "rejected")
    ) {
      return NextResponse.json({ error: "Invalid moderation payload" }, { status: 400 });
    }

    const resolvedModerator =
      typeof moderator === "string" && moderator.trim()
        ? moderator.trim()
        : "web-admin";
    const resolvedNote = typeof moderationNote === "string" ? moderationNote : undefined;

    const updated =
      scope === "cluster"
        ? await moderateCommunityReports({
            action,
            moderationNote: resolvedNote,
            moderator: resolvedModerator,
            reportIds:
              typeof reportIds === "string"
                ? reportIds
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean)
                : [],
          })
        : typeof reportId === "string"
        ? [
            await moderateCommunityReport({
              action,
              moderationNote: resolvedNote,
              moderator: resolvedModerator,
              reportId,
            }),
          ]
        : [];

    if (updated.length === 0) {
      return NextResponse.json({ error: "Invalid moderation payload" }, { status: 400 });
    }

    const targets = await getBranchModerationTargets(
      Array.from(new Set(updated.map((report) => report.branch_id)))
    );

    revalidatePath("/");
    revalidatePath("/closures");
    for (const target of targets) {
      revalidatePath(`/${target.stateSlug}/${target.suburbSlug}`);
      revalidatePath(`/bank/${target.bankSlug}/${target.stateSlug}/${target.suburbSlug}`);
      revalidatePath(`/atm/${target.suburbSlug}`);
    }
    revalidatePath("/admin/reports");

    return NextResponse.redirect(new URL("/admin/reports", request.url), 303);
  } catch (err) {
    console.error("[admin/reports/moderate] Failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to moderate report" },
      { status: 500 }
    );
  }
}
