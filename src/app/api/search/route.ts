import { NextRequest, NextResponse } from "next/server";
import { searchSuburbs } from "@/lib/data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await searchSuburbs(q, 8);
  return NextResponse.json(
    results.map((r) => ({
      name: r.name,
      postcode: r.postcode,
      state: r.state,
      slug: r.slug,
      stateSlug: r.stateSlug,
    }))
  );
}
