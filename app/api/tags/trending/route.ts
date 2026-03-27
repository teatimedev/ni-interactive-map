import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// GET /api/tags/trending — most popular tags across all wards
export async function GET(request: NextRequest) {
  if (!supabaseServer) {
    return NextResponse.json({ tags: [] });
  }

  const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "15", 10);

  // Fetch recent tags (last 30 days for broader trending data)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseServer
    .from("ward_tags")
    .select("tag, category")
    .eq("reported", false)
    .gte("created_at", thirtyDaysAgo)
    .limit(2000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate by tag
  const tagCounts = new Map<string, { tag: string; category: string; count: number }>();
  for (const row of data ?? []) {
    const existing = tagCounts.get(row.tag);
    if (existing) {
      existing.count++;
    } else {
      tagCounts.set(row.tag, { tag: row.tag, category: row.category, count: 1 });
    }
  }

  // Sort by count descending, take top N
  const trending = Array.from(tagCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.min(limit, 30));

  return NextResponse.json({ tags: trending });
}
