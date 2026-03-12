import { createHash } from "crypto";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

const REPORTS_ADMIN_COOKIE = "reports_admin_session";

function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function reportsAdminConfigured() {
  return Boolean(process.env.REPORTS_ADMIN_SECRET?.trim());
}

export function isValidReportsAdminSecret(secret: string | null | undefined) {
  const expected = process.env.REPORTS_ADMIN_SECRET?.trim();
  if (!expected || !secret) {
    return false;
  }

  return hashSecret(secret) === hashSecret(expected);
}

export async function hasReportsAdminSession() {
  const expected = process.env.REPORTS_ADMIN_SECRET?.trim();
  if (!expected) {
    return false;
  }

  const cookieStore = await cookies();
  const session = cookieStore.get(REPORTS_ADMIN_COOKIE)?.value;
  return session === hashSecret(expected);
}

export function withReportsAdminSession(response: NextResponse) {
  const expected = process.env.REPORTS_ADMIN_SECRET?.trim();
  if (!expected) {
    return response;
  }

  response.cookies.set(REPORTS_ADMIN_COOKIE, hashSecret(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export function clearReportsAdminSession(response: NextResponse) {
  response.cookies.set(REPORTS_ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function authorizeReportsAdminRequest(request: NextRequest) {
  const headerSecret =
    request.headers.get("x-admin-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (isValidReportsAdminSecret(headerSecret)) {
    return true;
  }

  const expected = process.env.REPORTS_ADMIN_SECRET?.trim();
  if (!expected) {
    return false;
  }

  const session = request.cookies.get(REPORTS_ADMIN_COOKIE)?.value;
  return session === hashSecret(expected);
}
