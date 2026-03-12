import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { authorizeReportsAdminRequest } from "@/lib/reports/auth";
import { moderateCommunityReport } from "@/lib/reports/supabase";
import { getBranchModerationTargets } from "@/lib/data";

export async function POST(request: NextRequest) {
  if (!(await authorizeReportsAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const reportId = formData.get("reportId");
    const action = formData.get("action");
    const moderationNote = formData.get("moderationNote");
    const moderator = formData.get("moderator");

    if (
      typeof reportId !== "string" ||
      (action !== "approved" && action !== "rejected")
    ) {
      return NextResponse.json({ error: "Invalid moderation payload" }, { status: 400 });
    }

    const updated = await moderateCommunityReport({
      action,
      moderationNote: typeof moderationNote === "string" ? moderationNote : undefined,
      moderator:
        typeof moderator === "string" && moderator.trim()
          ? moderator.trim()
          : "web-admin",
      reportId,
    });

    const [target] = await getBranchModerationTargets([updated.branch_id]);

    revalidatePath("/");
    revalidatePath("/closures");
    if (target) {
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
