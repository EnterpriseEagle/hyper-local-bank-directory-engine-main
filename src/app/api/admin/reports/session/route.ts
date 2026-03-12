import { NextRequest, NextResponse } from "next/server";
import {
  clearReportsAdminSession,
  isValidReportsAdminSecret,
  reportsAdminConfigured,
  withReportsAdminSession,
} from "@/lib/reports/auth";

export async function POST(request: NextRequest) {
  if (!reportsAdminConfigured()) {
    return NextResponse.json(
      { error: "Reports admin access is not configured." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  if (formData.get("intent") === "logout") {
    const response = NextResponse.redirect(new URL("/admin/reports", request.url), 303);
    return clearReportsAdminSession(response);
  }

  const token = formData.get("token");

  if (typeof token !== "string" || !isValidReportsAdminSecret(token)) {
    return NextResponse.redirect(new URL("/admin/reports?error=invalid-token", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/admin/reports", request.url), 303);
  return withReportsAdminSession(response);
}
