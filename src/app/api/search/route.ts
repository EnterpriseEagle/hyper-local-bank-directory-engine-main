import { NextRequest, NextResponse } from "next/server";
import { searchDirectorySuggestions } from "@/lib/data";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  const results = await searchDirectorySuggestions(q, 8);
  return NextResponse.json(results);
}
