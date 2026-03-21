import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const WWW_HOST = "www.banknearme.com.au";
const CANONICAL_HOST = "banknearme.com.au";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  if (host === WWW_HOST) {
    const redirectUrl = new URL(request.url);
    redirectUrl.host = CANONICAL_HOST;

    return NextResponse.redirect(redirectUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
